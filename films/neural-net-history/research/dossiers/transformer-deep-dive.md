# Dossier: Transformers in Depth — "Attention Is All You Need" and the Pretraining Era (2017–2019)

Topic id: `transformer-deep-dive` · Film: neural-net-history · As-of: 2026-10-05 · Deep dive: yes
Status: draft plus verification pass (2026-10-05). These primary sources were read in full as extracted text:
- the arXiv v7 PDF of "Attention Is All You Need" [S1];
- the GPT-1, BERT, GPT-2, ELMo, T5, Jain & Wallace and Liu et al. papers [S10–S16];
- OpenAI's four contemporaneous blog posts, from the Wayback Machine [S17–S20];
- Google's 31 August 2017 Transformer blog post [S5] and the 25 October 2019 BERT-in-Search post [S22];
- the Wired oral history by Steven Levy, 20 March 2024 [S3];
- The New Yorker feature by Stephen Marche, 23 August 2024 [S4];
- The Verge's report on the GPT-2 debate [S24], The Guardian's GPT-2 headline [S23], and the Anthropic induction-heads paper [S28].

arXiv submission histories were checked on the arXiv abstract pages. **Adversarial fact-check completed 2026-10-05**: corrections were made in place; see section 12, Fact-check log. The FT oral history (July 2023) is paywalled and was **not** read. Post-2024 career moves rest partly on Wikipedia leads and are marked as such.

Status tags:
- **[VERIFIED-PRIMARY]**: checked against the original paper, the official blog post, or the speaker's own words as printed in a named interview.
- **[VERIFIED-SECONDARY]**: checked against a reputable secondary source.
- **[DERIVED]**: our own arithmetic from primary numbers. The working is shown, and the film may state it as "by our count".
- **[LEAD]**: found only in Wikipedia or similar. It needs a primary check before the film states it.
- **[UNVERIFIED]**: do not state as fact, and do not quote.

Source numbers such as [S1] refer to section 11.

---

## 1. Summary

On **12 June 2017** eight Google researchers posted *"Attention Is All You Need"* to arXiv (1706.03762) [S2]. It was presented at **NIPS 2017 in Long Beach, California**, in December [S1][S3].

**The problem they set out to solve.** In 2017 the best machine-translation systems, Google Translate's included, were **recurrent neural networks (RNNs/LSTMs)** with an **attention** mechanism bolted on. Such a network reads a sentence one word at a time. Each step must wait for the step before it, so training cannot be spread across the thousands of parallel arithmetic units in a GPU. Information between distant words must also pass through every word in between [S1][S5].

**The authors' fix.** Throw out recurrence entirely and keep only attention. The paper says it relies "entirely on an attention mechanism to draw global dependencies between input and output" [S1]. In one step, every word looks at every other word, using a single large matrix multiplication. That is exactly the operation GPUs and TPUs do best [S1][S4].

**The model.** The Transformer is an encoder–decoder: **6 encoder layers and 6 decoder layers**, vectors of size **d_model = 512**, **8 attention heads** of size 64, and feed-forward inner layers of size 2048. That comes to about **65 million parameters** in the "base" model and **213 million** in the "big" model. The core equation is **Attention(Q,K,V) = softmax(QKᵀ/√d_k)·V** [S1]. **[VERIFIED-PRIMARY]**

**The results.** On the WMT 2014 English→German benchmark, the big model scored **28.4 BLEU**, more than 2 BLEU above the best previous results, *including ensembles*. On English→French it scored **41.8 BLEU** (Table 2 and the abstract). The base model trained in **12 hours** and the big model in **3.5 days**, each on **one machine with 8 NVIDIA P100 GPUs**. That was a small fraction of the training compute of the systems it beat [S1]. **[VERIFIED-PRIMARY]**

**The pretraining era (2018–2019).** Within 18 months the Transformer became the substrate for a new recipe. *Pretrain* one big network on huge amounts of unlabeled text by having it predict words, then *fine-tune* it, or simply prompt it, for any task:
- **ELMo**, Allen Institute for AI, February 2018. This pretrained recipe used bidirectional **LSTMs**, not a Transformer [S12]. It was *not* the first pretrained contextual model: CoVe (McCann et al., 1 Aug 2017) and ULMFiT (Howard & Ruder, 18 Jan 2018) came earlier, and GPT-1 itself cites Dai & Le (2015) and ULMFiT as precedents [S10][S35].
- **GPT-1**, OpenAI, 11 June 2018. A 12-layer **decoder-only** Transformer trained on 7,000 unpublished books, "1 month on 8 GPUs" [S10][S18].
- **BERT**, Google, 11 October 2018. A bidirectional **encoder-only** Transformer that set new records on eleven tasks (GLUE 80.4 in the October 2018 v1; 80.5 in the May 2019 revision) [S11].
- **GPT-2**, OpenAI, 14 February 2019. 1.5 billion parameters and 40 GB of web text. OpenAI at first withheld the full model, citing "concerns about malicious applications", and released it in stages through 5 November 2019 [S13][S17][S19][S20].
- **T5**, Google, October 2019. Every task cast as "text-to-text", with up to 11 billion parameters [S15].

The simplest of these forms, the **decoder-only next-token predictor**, became the dominant design. GPT-3, ChatGPT and their successors all descend from it (see the separate dossiers).

**What attention "means" was contested from the start.** The original paper suggested that self-attention "could yield more interpretable models" and showed heads that seem to track grammar [S1]. In 2019 **Jain & Wallace** argued that "Attention is not Explanation" [S14]. **Wiegreffe & Pinter** replied with "Attention is not not Explanation" [S27]. Later mechanistic-interpretability work at Anthropic reverse-engineered real circuits built from attention heads. The best known is the **"induction head"**, a two-head circuit that copies patterns of the form [A][B] … [A] → [B]. It was first described and named in **Elhage et al. (22 Dec 2021)**; **Olsson et al. (8 Mar 2022)** then argued it may account for most "in-context learning" [S28]. The attention *pattern* alone is not an explanation; the *circuit* can be.

**What became of the eight.** All eight eventually left Google [S3]:
- **Polosukhin**, NEAR (blockchain).
- **Gomez**, Cohere.
- **Vaswani and Parmar**, Adept, then Essential AI.
- **Shazeer**, Character.AI. He returned to Google in August 2024 [S25] and left Google again for **OpenAI in June 2026** (reported by Reuters, CNBC and Axios, 17–18 Jun 2026) [S29]. As of the film's as-of date he is **not** at Google.
- **Uszkoreit**, Inceptive (biotech).
- **Jones**, Sakana AI (Tokyo).
- **Kaiser**, OpenAI.

**Teen-level intuition (one paragraph the narrator can lean on).** Imagine every word in a sentence holding up three cards:
- a **question** card (Query): "what am I looking for?";
- a **label** card (Key): "what do I contain?";
- a **message** card (Value): "what will I pass along if you pick me?"

Each word compares its question with every other word's label. The comparison is a dot product, which measures how well two lists of numbers line up. The scores are squashed into percentages that add to 100% (the softmax). The word then takes that percentage mix of everyone's messages. "Bank" asks "am I about money or water?", finds that "river" has the matching label, and absorbs mostly river-ness. Every word does this at the same time, which is why it is fast. Eight sets of cards (eight "heads") let a word ask eight different questions at once. Stack six layers of this and a network can untangle grammar, references and meaning.

---

## 2. Timeline (dated events)

| Date | Event | Sources | Status |
|---|---|---|---|
| 1997 | Hochreiter & Schmidhuber publish **Long Short-Term Memory** (*Neural Computation* 9(8)). It is the RNN variant the Transformer would displace. | [S1] ref [13]; https://doi.org/10.1162/neco.1997.9.8.1735 | VERIFIED-PRIMARY (citation in S1) |
| 1 Sep 2014 | Bahdanau, Cho & Bengio post **"Neural Machine Translation by Jointly Learning to Align and Translate"**: attention ("soft-search") added to an RNN encoder–decoder. Accepted as an ICLR 2015 oral. | [S6] | VERIFIED-PRIMARY |
| 10 Sep 2014 | Sutskever, Vinyals & Le, **"Sequence to Sequence Learning with Neural Networks"** (LSTM encoder–decoder) | https://arxiv.org/abs/1409.3215 | VERIFIED-PRIMARY (arXiv v1 10 Sep 2014, re-fetched in fact-check) |
| 2016 (EMNLP) | Parikh, Täckström, Das & **Uszkoreit**, "A Decomposable Attention Model". This is the 2016 self-attention-style paper Wired describes; AIAYN cites it as one of the few attention models without recurrence. | [S1] ref [27]; [S3] | VERIFIED-PRIMARY |
| 26 Sep 2016 | Google publishes **GNMT**, its production LSTM-plus-attention neural translation system (Wu et al., arXiv 1609.08144). It is a baseline in AIAYN's Table 2. | https://arxiv.org/abs/1609.08144; [S1] ref [38] | VERIFIED-PRIMARY (arXiv v1 26 Sep 2016, re-fetched in fact-check) |
| 2016 | Uszkoreit and Polosukhin have lunch in a Google café; Uszkoreit suggests self-attention for Polosukhin's fast question-answering problem. Uszkoreit, Polosukhin and Vaswani write a design doc, **"Transformers: Iterative Self-Attention and Processing for Various Tasks"**. | [S3] | VERIFIED-SECONDARY (first-hand recollections in Wired) |
| Early 2017 | Polosukhin leaves Google to start his own company, before the paper is finished. | [S3] | VERIFIED-SECONDARY |
| 8 May 2017 | Facebook AI Research posts **ConvS2S** (Gehring et al., arXiv 1705.03122). Its convolutional translation results are the number the Google team is "trying to beat" (Parmar). | [S1] ref [9]; [S4] | VERIFIED-PRIMARY (ref) / VERIFIED-SECONDARY (Parmar's recollection) |
| Early 2017 (Wired: "one day in 2017") | Shazeer overhears Vaswani and Parmar while passing Kaiser's workspace in Building 1965, joins, and rewrites the code; a sprint toward the May deadline begins. | [S3] | VERIFIED-SECONDARY (season not stated by Wired) |
| **19 May 2017** | NIPS 2017 paper deadline (Fri 19 May 2017, 20:00 UTC per the NIPS call for papers). Per Parmar, the English–French numbers arrive "like, five minutes before we submitted"; Wired's narration says the paper went in "with barely two minutes to spare". | [S3]; [S36] | VERIFIED-PRIMARY (deadline) / VERIFIED-SECONDARY (recollection) |
| **12 Jun 2017** | arXiv v1 of **"Attention Is All You Need"** (1706.03762), submitted by Llion Jones. Revisions follow: v2 19 Jun, v3 20 Jun, v4 30 Jun, v5 6 Dec 2017, v6 24 Jul 2023, v7 2 Aug 2023. | [S2] | VERIFIED-PRIMARY |
| ~late May / June 2017 | "Two weeks" after the 3 a.m. late-sprint conversation with Vaswani, with Gomez back at school in Toronto, Kaiser emails him "Generated Wikipedia Articles": a transformer model given two days to read "a little less than half" of Wikipedia invents five plausible articles titled "The Transformer". The New Yorker does not date this relative to the submission. | [S4] | VERIFIED-SECONDARY (Gomez's recollection) |
| **31 Aug 2017** | Google Research blog post "Transformer: A Novel Neural Network Architecture for Language Understanding", by Jakob Uszkoreit; the Tensor2Tensor library is open-sourced. | [S5] | VERIFIED-PRIMARY |
| **6 Dec 2017** | NIPS poster session in Long Beach. The crowd stays until the 10:30 pm close ("Security had to tell us to leave"), and Sepp Hochreiter, co-inventor of the LSTM, praises the work. | [S3] | VERIFIED-SECONDARY |
| 30 Jan 2018 | Liu, Saleh, Pot, Goodrich, Sepassi, **Kaiser, Shazeer**, "Generating Wikipedia by Summarizing Long Sequences", introduces a **decoder-only** Transformer. GPT-1 cites it for its architecture. | [S16]; [S10] ref [34] | VERIFIED-PRIMARY |
| 15 Feb 2018 | **ELMo** (Peters et al., Allen Institute for AI and the University of Washington) is posted to arXiv. NAACL 2018 named it one of four "Outstanding Papers" (chairs' blog, 11 Apr 2018). Earlier pretrained contextual models: CoVe (arXiv 1 Aug 2017) and ULMFiT (arXiv 18 Jan 2018). | [S12]; [S35] | VERIFIED-PRIMARY (arXiv dates, Outstanding Paper list). The "27 Oct 2017 OpenReview" date and a "best paper" award are UNVERIFIED; do not state. |
| Spring 2018 | Shazeer gives a talk titled "Bigger Is Better" on scaling transformers. | [S4] | VERIFIED-SECONDARY |
| **11 Jun 2018** | OpenAI blog post "Improving Language Understanding with Unsupervised Learning" (**GPT-1**; paper by Radford, Narasimhan, Salimans, Sutskever). | [S18][S10] | VERIFIED-PRIMARY |
| **11 Oct 2018** | **BERT** (Devlin, Chang, Lee, Toutanova; Google AI Language) is posted to arXiv. v1 reports GLUE 80.4 (+7.6); the v2 revision of 24 May 2019 reports 80.5 (+7.7). | [S11] | VERIFIED-PRIMARY |
| **14 Feb 2019** | OpenAI announces **GPT-2** ("Better Language Models and Their Implications") and withholds the full 1.5B model. The Guardian headline the same day: "New AI fake text generator may be too dangerous to release, say creators". | [S17][S23] | VERIFIED-PRIMARY |
| 21 Feb 2019 | The Verge reports the backlash: Anandkumar, Rao and others criticise the decision, and OpenAI's Miles Brundage responds. | [S24] | VERIFIED-PRIMARY |
| 26 Feb 2019 | Jain & Wallace post **"Attention is not Explanation"** (NAACL 2019). | [S14] | VERIFIED-PRIMARY |
| May 2019 | OpenAI releases the next GPT-2 model, called **"345M"** in the May 2019 update and relabelled **355M** by August 2019. | [S17 (May update)][S19] | VERIFIED-PRIMARY |
| 11 Jun 2019 | Clark, Khandelwal, Levy & Manning post "What Does BERT Look At?": some heads track syntax and coreference "with remarkably high accuracy". | [S26] | VERIFIED-PRIMARY |
| 13 Aug 2019 | Wiegreffe & Pinter post **"Attention is not not Explanation"** (EMNLP 2019). | [S27] | VERIFIED-PRIMARY |
| 20 Aug 2019 | OpenAI's "GPT-2: 6-Month Follow-Up" releases the 774M model. | [S19] | VERIFIED-PRIMARY |
| 23 Oct 2019 | **T5** (Raffel et al., Google), "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer", with the C4 corpus (about 750 GB) and models up to 11B parameters. | [S15] | VERIFIED-PRIMARY |
| 25 Oct 2019 | Google: BERT now helps rank "one in 10 searches in the U.S. in English". | [S22] | VERIFIED-PRIMARY |
| **5 Nov 2019** | OpenAI releases the full **1.5B GPT-2**, the final stage of the staged release. | [S20] | VERIFIED-PRIMARY |
| 2019 | Gomez leaves Google Brain and co-founds **Cohere** in Toronto. | [S3] | VERIFIED-SECONDARY |
| Oct 2021 | Shazeer leaves Google and co-founds **Character.AI** with Daniel De Freitas. | [S3] | VERIFIED-SECONDARY |
| 22 Dec 2021 | Elhage et al. (Anthropic), "A Mathematical Framework for Transformer Circuits". **First describes and names "induction heads"** in two-layer attention-only models. | https://transformer-circuits.pub/2021/framework/index.html | VERIFIED-PRIMARY (page reads "Published Dec 22, 2021") |
| **8 Mar 2022** | Olsson et al. (Anthropic), **"In-context Learning and Induction Heads"** (arXiv copy 24 Sep 2022). Builds on the induction heads "discovered" in "our previous paper" (Elhage et al.) and links them to in-context learning. | [S28]; https://arxiv.org/abs/2209.11895 | VERIFIED-PRIMARY |
| 20 Mar 2024 | Wired publishes Steven Levy's oral history, "8 Google Employees Invented Modern AI. Here's the Inside Story". | [S3] | VERIFIED-PRIMARY |
| 2 Aug 2024 | Google hires back Shazeer and De Freitas from Character.AI in a licensing deal. Reuters, 23 Aug 2024: Shazeer becomes co-lead of Gemini. | [S25]; https://www.reuters.com/technology/google-appoints-former-characterai-founder-co-lead-its-ai-models-2024-08-23/ | VERIFIED-SECONDARY (Verge, published 3 Aug 2024 00:31 UTC = 2 Aug US time; he joins Google DeepMind). Gemini co-lead: VERIFIED-SECONDARY at headline level (2026 Reuters/CNBC headlines call him "Google Gemini co-lead") |
| 23 Aug 2024 | The New Yorker publishes Stephen Marche's "Was Linguistic A.I. Created by Accident?" | [S4] | VERIFIED-PRIMARY |
| Apr 2026 | Cohere announces a **merger** (not an acquisition) with Germany's Aleph Alpha (TechCrunch, 25 Apr 2026, "Why Cohere is merging with Aleph Alpha"); the merger agreement is signed 16 Sep 2026 (PR Newswire; Reuters). | [S31][S37] | VERIFIED-SECONDARY (headline level, several outlets; article bodies not read) |
| 17–18 Jun 2026 | Shazeer, then Google's Gemini co-lead, leaves Google for **OpenAI** (Reuters, "Google Gemini co-lead Noam Shazeer to join IPO-bound OpenAI"; CNBC; Axios). | [S29][S37] | VERIFIED-SECONDARY (headline level, several outlets; article bodies paywalled/blocked) |
| Jun 2026 | Wikipedia reports that Essential AI and Vaswani were "acqui-hired" by Nvidia (citing Axios, 23 Jun 2026). | [S30] | **UNVERIFIED / LEAD**: the Axios page was blocked and no other outlet confirmed it to us. Do not state. |

---

## 3. People

Appearance notes are for **respectful silhouette depiction only**. They are generalised from widely circulated public photos and interviews. **The art department must confirm each against a licensed reference photo before drawing a likeness.** Where we are unsure, we say so and suggest identifying the person by props and settings rather than by facial features. All eight were at Google in Mountain View, California, in 2016–17, apart from Gomez, an intern from Toronto. The team worked in **Buildings 1945 and 1965 on Charleston Road**, on the northern edge of the campus. They gravitated to 1965 because "it had a better espresso machine in the micro-kitchen" [S3].

The paper lists them in this order with the footnote **"Equal contribution. Listing order is random."** [S1] The footnote also states each person's role, verbatim, in the column below.

| # | Person | Role in 2017 (per the paper's contribution footnote [S1]) | Institution (2017) | Background (per [S3][S4]) | What they believed | Afterwards | Silhouette notes |
|---|---|---|---|---|---|---|---|
| 1 | **Ashish Vaswani** | "Ashish, with Illia, designed and implemented the first Transformer models and has been crucially involved in every aspect of this work." | Google Brain, Mountain View | Born in India and raised mostly in the Middle East [S3]. PhD from USC in its machine-translation group (advisers David Chiang and Liang Huang, per Wikipedia [LEAD]; thesis 2014). | Called Brain "a radical group" that believed "neural networks were going to advance human understanding" [S3]. In 2017 he told Gomez the work was "bigger" than translation [S4][S3]. | Co-founded Adept (2021) with Parmar [S3], then Essential AI (CEO) [S3]. 2026 Nvidia acqui-hire: LEAD [S30]. | Slim build, dark hair, often a trimmed beard (confirm). Depict him on the office couch by the curtain whose pattern looked "like synapses and neurons" [S3]. |
| 2 | **Noam Shazeer** | "Noam proposed scaled dot-product attention, multi-head attention and the parameter-free position representation and became the other person involved in nearly every detail." | Google Brain | At Google since 2000, "an in-house legend", starting with work on the early ad system [S3]. Wikipedia [LEAD]: IMO 1994 gold with a perfect score, and Duke. | Found RNNs "irritating": "Let's go replace them!" [S3]. Pushed scale ("Bigger Is Better", 2018 [S4]). Proposed to executives that Google abandon the search index and train one huge transformer; at the time even Kaiser thought this ridiculous [S3]. | Left Oct 2021 and co-founded Character.AI [S3]. Rehired by Google in Aug 2024 [S25]. Left Google for OpenAI in June 2026: VERIFIED-SECONDARY (Reuters/CNBC/Axios headlines, 17–18 Jun 2026) [S29][S37]. | Tall (confirm), full beard, and per Wikipedia an observant Orthodox Jew, so possibly a kippah in the silhouette (confirm from photos; depict respectfully, not as a gag). |
| 3 | **Niki Parmar** | "Niki designed, implemented, tuned and evaluated countless model variants in our original codebase and tensor2tensor." | Google Research | Indian engineer; USC master's 2015; chose Google over other Big Tech offers [S3]. | "We had done it in less time than anyone out there… And that was only the beginning" [S3]. | Co-founded Adept, then Essential AI, with Vaswani [S3]. Later career: multiple outlets reported her move to **Anthropic** in early 2025 (Analytics India Magazine, 25 Feb 2025; Moneycontrol, 1 Mar 2025, "Anthropic's Niki Parmar") [S37]. Headline-level only; the start date is **UNVERIFIED**. State only as "later joined Anthropic", if at all. | Long dark hair (confirm). Scene: sitting in the Building 1965 micro-kitchen getting "that last number in" minutes before the deadline [S3]. |
| 4 | **Jakob Uszkoreit** | "Jakob proposed replacing RNNs with self-attention and started the effort to evaluate this idea." | Google Research | Son of the computational linguist **Hans Uszkoreit**, who was jailed for 15 months in East Germany for protesting the 1968 Soviet invasion of Czechoslovakia [S3]. Born in California while his father worked at SRI; studied in Germany; came to Google as an intern [S3]. | Self-attention "considers everything" [S3]. Argued for it on whiteboards in Building 1945 "to anyone who would listen, and some who wouldn't" [S3]. Disagreed with his father at the dinner table [S3]. | Inceptive, an RNA/biotech company (cofounder and CEO) [S3]. Based in Berlin in 2024 [S3]. | Tall, outdoorsy; drove a "mountain expedition truck" or "four-by-four" and went paragliding [S3][S4]. Silhouette: man by a dusty 4×4 in a car park, uncorking old champagne. |
| 5 | **Llion Jones** | "Llion also experimented with novel model variants, was responsible for our initial codebase, and efficient inference and visualizations." He also submitted the arXiv versions [S2]. | Google Research | Born and raised in Wales [S3]; Wikipedia [LEAD] says born 1984 in Bangor. University of Birmingham MSc 2009, "lived on the dole for months" in the recession, then applied to Google as a "hail Mary" [S3]. | Coined the title from the Beatles: "I'm British… It literally took five seconds of thought. I didn't think they would use it." [S3] | Co-founded **Sakana AI** in Tokyo (2023) with David Ha [S3]; Wikipedia [LEAD]. | Use the visual of the attention-visualisation figures; the paper credits Jones with "visualizations" [S1], while Wired says Gomez "produced the visualizations and diagrams for the paper" [S3]. Treat the figures as shared work. Appearance: confirm from photos. |
| 6 | **Aidan N. Gomez** | "Lukasz and Aidan spent countless long days designing various parts of and implementing tensor2tensor, replacing our earlier codebase, greatly improving results and massively accelerating our research." | University of Toronto undergraduate and Google Brain intern (paper affiliation: Toronto, work done at Google Brain) [S1] | Grew up in a small farming village in Ontario where his family tapped maple trees [S3]. Joined Hinton's lab as an undergraduate [S3]. **Aged 20**, too young to drink in the US [S4]. Only later learned the internship was meant for PhD students [S3]. | "It's just machine translation… Isn't this just what research is?" (to Vaswani, 3 a.m. [S4]). Later: "I was shocked, blown away" by the generated Wikipedia articles [S4]. | Co-founded **Cohere** in Toronto in 2019 [S3]. Cohere agreed to merge with Aleph Alpha in 2026 (announced Apr, signed 16 Sep) [S37]. | Youngest of the eight: slim, boyish, hoodie-era intern. Scene: stretched out exhausted on the second floor of Building 1965 at 3 a.m. [S4]. |
| 7 | **Łukasz Kaiser** | (Co-credited with Gomez above.) | Google Brain | Polish-born theoretical computer scientist [S3]; had worked on parsing-based translation [S4]. Pursued a "unified model of everything" [S4]. | Added the **parsing experiment** that showed the model was "a language machine", not just a translator [S4]. Thought Shazeer's replace-the-index idea "ridiculous" at the time [S3]. | Joined **OpenAI** and is the only one of the eight who has not founded a company [S3]. | Confirm from photos. |
| 8 | **Illia Polosukhin** | "Ashish, with Illia, designed and implemented the first Transformer models." Paper affiliation is a gmail address, with a footnote: "Work performed while at Google Research." [S1] | Google Research (left early 2017) | Born in Ukraine; nearly three years at Google, on the team answering questions directly in the search box, where "you have milliseconds" [S3]. | Explained RNN slowness: "If you have a thousand words, you have to wait for a thousand cycles." [S4] | Left in early 2017 [S3] and co-founded **NEAR** (a blockchain), the one company of the eight's not built on transformers [S3]. | Confirm from photos. |

**Others who matter in this chapter**
- **Dzmitry Bahdanau, Kyunghyun Cho, Yoshua Bengio** (Université de Montréal): attention for RNN translation, 2014 [S6].
- **Sepp Hochreiter**, co-inventor of the LSTM: praised the Transformer at the NIPS 2017 poster [S3].
- **Mat Kelcey**, the Google colleague who told Jones about self-attention and then doubted it: "basically the biggest incorrect prediction of my life" [S3].
- **Hans Uszkoreit**: the sceptical father, who later co-founded an LLM company "Using transformers, of course" [S3].
- **Alec Radford** (OpenAI): lead author of GPT-1 and GPT-2. Per Wired, Ilya Sutskever suggested soon after the paper that Radford work on the idea [S3][S10][S13].
- **Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova** (Google AI Language, Seattle): BERT [S11].
- **Matthew Peters et al.** (Allen Institute for AI and the University of Washington, Seattle): ELMo [S12].
- **Colin Raffel et al.** (Google): T5 [S15].
- **Sarthak Jain & Byron Wallace** (Northeastern University, Boston): "Attention is not Explanation" [S14]. **Sarah Wiegreffe & Yuval Pinter** (Georgia Tech): the rebuttal [S27].
- **Catherine Olsson, Nelson Elhage, Neel Nanda, Chris Olah et al.** (Anthropic, San Francisco): induction heads [S28].
- **Miles Brundage** (OpenAI), **Anima Anandkumar** (Caltech and NVIDIA), **Delip Rao**: the voices in the GPT-2 release debate [S24].

---

## 4. The belief of the age

**Belief A (to 2017): "Sequence needs recurrence."** Language arrives in order, so a model of language should process it in order. RNNs, and especially LSTMs (1997) and GRUs, were "firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation". Those are the paper's own first words [S1]. Attention was regarded as an *add-on* to RNNs: "In all but a few cases… such attention mechanisms are used in conjunction with a recurrent network" [S1].
- *Who held it:* nearly the whole field, including Google Translate's production GNMT system (LSTM plus attention, 2016) [S1 ref 38].
- *Who dissented:* convolutional models tried to escape sequential processing. These were ByteNet (DeepMind) and ConvS2S (Facebook, May 2017) [S1]. Inside Google, Uszkoreit had argued for self-attention since around 2014 [S3]. The reception: "People raised their eyebrows, because it dumped out all the existing neural architectures" [S3].
- *How long it held:* about 20 years for LSTMs as the default (1997 to 2017–18). It ended within about 18 months of the paper, through the Transformer's BLEU and speed results (2017), then BERT and GPT (2018) [S1][S10][S11]. Google moved Translate to transformers in 2018 [S3].
- *Even the inventors hedged.* Uszkoreit: early on, compared to LSTMs, "it wasn't better" until Shazeer joined [S3]. Kelcey called it the "biggest incorrect prediction of my life" [S3].

**Belief B (to about 2018): "Each NLP task needs its own labelled data and its own architecture."** Pretraining meant *word vectors* (word2vec 2013, GloVe 2014), a fixed lookup table of word meanings. GPT-1's paper names this as the status quo [S10]. ELMo (contextual vectors from a pretrained bi-LSTM), GPT-1 and BERT replaced it with *pretrain the whole network, then fine-tune*. BERT's abstract: fine-tuned "with just one additional output layer… without substantial task-specific architecture modifications" [S11].

**Belief C (2019 onward): "Language models are useful feature extractors, not general task-solvers."** GPT-2's paper challenged this: "language models begin to learn these tasks without any explicit supervision" (zero-shot) [S13]. It was contested at the time; the critics in the GPT-2 debate said the model generates text "but doesn't understand it" [S24]. The fuller test came with GPT-3 (2020; separate dossier).

**Belief D (2017–2019): "Attention weights show you what the model is thinking."** The original paper offered self-attention as a route to "more interpretable models" [S1]. Jain & Wallace (2019) quote the common view, "Attention provides an important way to explain the workings of neural models" (Li et al. 2016), and challenged it [S14]. The debate settled into a nuanced view:
- Attention weights are *not by themselves* a faithful explanation [S14].
- They are not meaningless either [S27][S26].
- Real understanding requires tracing circuits: the Anthropic transformer-circuits work, 2021–22 [S28].

**Belief E (2017–2019): "Bigger models need proportionally more labelled data; scale gives diminishing returns."** Shazeer's 2018 "Bigger Is Better" talk [S4] and GPT-2's finding that performance improves "in a log-linear fashion" with capacity while the model "still underfits WebText" [S13] pointed the other way. Both anticipate the scaling-laws era (separate dossier).

---

## 5. Experiments and results (the mechanics, with numbers)

### 5.1 The setup that produced the paper [S1] [VERIFIED-PRIMARY]

**Hardware.** "one machine with 8 NVIDIA P100 GPUs." The art department should know what that is:
- The P100 ("Pascal", 2016) is a slab-like datacenter GPU accelerator.
- Eight of them sit in a single rack server, not a room-sized supercomputer.
- The paper values each at about 9.5 TFLOPS of sustained single precision (footnote 5).

**Base model.** 100,000 training steps at about 0.4 s per step, which is **12 hours**.

**Big model.** 300,000 steps at 1.0 s per step, which is **3.5 days**.

**Data.**
- **WMT 2014 English–German:** about **4.5 million sentence pairs**, byte-pair encoded into a shared vocabulary of about **37,000 tokens**.
- **WMT 2014 English–French:** **36 million sentences** and a **32,000** word-piece vocabulary.
- **Batches:** each training batch held about 25,000 source tokens plus 25,000 target tokens.

**Optimiser.**
- Adam, with β1 = 0.9, β2 = 0.98 and ε = 10⁻⁹.
- Learning rate = d_model^−0.5 · min(step^−0.5, step · warmup^−1.5), with **warmup = 4000** steps. The rate climbs linearly, then decays as 1/√step.

**Regularisation.**
- Dropout 0.1 on each sub-layer output and on the embedding sums.
- Label smoothing ε = 0.1. The paper says this "hurts perplexity, as the model learns to be more unsure, but improves accuracy and BLEU score".

**Decoding.** Beam search with a beam of 4 and length penalty α = 0.6. The final model averages checkpoints: the last 5 for base and the last 20 for big.

**Code.** First an internal codebase (Jones), then **Tensor2Tensor**, which was open-sourced (Kaiser and Gomez) [S1][S5].

### 5.2 The architecture, piece by piece [S1] [VERIFIED-PRIMARY unless tagged]

| Component | What the paper specifies | Teen-level intuition |
|---|---|---|
| **Tokens** | Sentences split into byte-pair or word-piece sub-word units, about 37k shared EN–DE and 32k EN–FR | Words are chopped into common chunks ("trans", "former"), so any word can be spelled from a fixed dictionary. |
| **Embeddings** | Learned vectors of size d_model = **512**. One weight matrix is *shared* between the input embedding, the output embedding and the pre-softmax layer, and is multiplied by √d_model in the embedding layers | Each token becomes a list of 512 numbers, its coordinates in "meaning space". |
| **Positional encoding** | Added (not concatenated) to the embeddings: PE(pos, 2i) = sin(pos/10000^(2i/d_model)), PE(pos, 2i+1) = cos(pos/10000^(2i/d_model)). "The wavelengths form a geometric progression from 2π to 10000·2π." The authors chose sinusoids because "for any fixed offset k, PE_pos+k can be represented as a linear function of PE_pos", and because they "may allow the model to extrapolate to sequence lengths longer than the ones encountered during training". Learned position embeddings gave "nearly identical results" (Table 3, row E: 25.7 vs 25.8 BLEU). | Attention by itself is order-blind, like a bag of words. So each position gets a unique "barcode" of waves, from fast ripples to slow swells, like the hands of a clock: second, minute, hour… The longest wavelength is about 62,832 positions [DERIVED: 2π×10000]. |
| **Scaled dot-product attention** | **Attention(Q,K,V) = softmax(QKᵀ/√d_k)·V** (Eq. 1). "We compute the dot products of the query with all keys, divide each by √d_k, and apply a softmax function to obtain the weights on the values." | The question / label / message cards (section 1). |
| **Why divide by √d_k** | "We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients." Footnote 4: if q and k have independent components with mean 0 and variance 1, then q·k has mean 0 and **variance d_k**. Dividing by √d_k brings the variance back to 1. Without the scaling, dot-product attention lost to additive (Bahdanau-style) attention at large d_k [S1, citing Britz et al.]. | With 64 dimensions a raw score swings by about ±8. A softmax over [8, 0, −8] gives [0.9997, 0.0003, 0.0000]: a hard, frozen choice that cannot learn. Scaled to [1, 0, −1] it gives [0.67, 0.24, 0.09]: soft, so learning signals flow [DERIVED]. |
| **Multi-head attention** | **h = 8** heads, each with **d_k = d_v = 64** (= 512/8). Q, K and V are each projected by learned matrices W_i^Q, W_i^K, W_i^V. The heads run in parallel, their outputs are concatenated and projected by W^O. "Due to the reduced dimension of each head, the total computational cost is similar to that of single-head attention with full dimensionality." The rationale: "With a single attention head, averaging inhibits this." | Eight small spotlights instead of one big floodlight. One head can track "which noun does this verb belong to" while another tracks "what does 'its' refer to". |
| **Three uses of attention** | (1) Encoder self-attention: every source word looks at every source word. (2) Decoder **masked** self-attention: each target position looks only at earlier positions; illegal connections are set to **−∞** before the softmax. (3) **Encoder–decoder attention**: decoder queries look at the encoder's keys and values, which "mimics the typical encoder-decoder attention mechanisms" of Bahdanau-style models. | The mask is a blindfold over the future, so the model cannot cheat by peeking at the word it is meant to predict. |
| **Feed-forward sub-layer** | FFN(x) = max(0, xW1 + b1)W2 + b2, applied "to each position separately and identically". Inner size **d_ff = 2048**, a 4× expansion. | After the words *talk to each other* (attention), each word *thinks privately* (FFN). |
| **Residual + LayerNorm** | Each sub-layer's output is **LayerNorm(x + Sublayer(x))**, with residuals from He et al. (ResNet) and layer normalisation from Ba, Kiros & Hinton 2016. All sub-layers output size 512 so that the additions line up. (This "post-LN" placement was later commonly moved to "pre-LN"; see section 8.) | A highway lane alongside every layer: the original signal is kept and each layer adds a correction. That makes deep stacks trainable. |
| **Stacks** | Encoder **N = 6** identical layers, each with 2 sub-layers. Decoder N = 6, each with 3 sub-layers. | Six rounds of "talk, then think". |
| **Output** | Linear layer, then softmax, giving next-token probabilities. Decoding is auto-regressive: each generated token is fed back in. | The decoder writes the translation one token at a time, each time asking "given everything so far, what comes next?" |

**Base vs big** (Table 3):

| | N | d_model | d_ff | h | d_k = d_v | P_drop | steps | params | dev BLEU (newstest2013) |
|---|---|---|---|---|---|---|---|---|---|
| base | 6 | 512 | 2048 | 8 | 64 | 0.1 | 100K | **65M** | 25.8 |
| big | 6 | 1024 | 4096 | 16 | 64 | 0.3* | 300K | **213M** | 26.4 |

*The big model used P_drop = 0.3 for EN–DE; the EN–FR big model used 0.1 (§6.1) [S1].

**Parameter check [DERIVED]**
- Each encoder layer: attention 4×512² ≈ 1.05M, plus FFN 2×512×2048 ≈ 2.10M. Times 6, that is ≈ 18.9M.
- Each decoder layer: two attentions (≈ 2.10M) plus the FFN (≈ 2.10M). Times 6, that is ≈ 25.2M.
- Shared embedding: 37,000 × 512 ≈ 18.9M.
- Total ≈ 63.0M before biases and layer norms. That agrees with the paper's 65M.

**Ablations worth showing** (Table 3, EN–DE dev BLEU; the base model is 25.8)
- 1 head: 24.9. 4 heads: 25.5. 16 heads: 25.8. 32 heads: 25.4. "Single-head attention is 0.9 BLEU worse than the best setting, quality also drops off with too many heads."
- No dropout: 24.6.
- d_model = 1024: 26.0.
- d_ff = 4096: 26.2.
- Learned positions: 25.7.

### 5.3 Results (Table 2, newstest2014) [VERIFIED-PRIMARY]

| Model | EN–DE BLEU | EN–FR BLEU | Training FLOPs (EN–DE / EN–FR) |
|---|---|---|---|
| ByteNet | 23.75 | — | — |
| GNMT + RL (Google's LSTM system) | 24.6 | 39.92 | 2.3·10¹⁹ / 1.4·10²⁰ |
| ConvS2S (Facebook) | 25.16 | 40.46 | 9.6·10¹⁸ / 1.5·10²⁰ |
| MoE (Shazeer et al.) | 26.03 | 40.56 | 2.0·10¹⁹ / 1.2·10²⁰ |
| GNMT + RL **Ensemble** | 26.30 | 41.16 | 1.8·10²⁰ / 1.1·10²¹ |
| ConvS2S **Ensemble** | 26.36 | 41.29 | 7.7·10¹⁹ / 1.2·10²¹ |
| **Transformer (base)** | **27.3** | 38.1 | **3.3·10¹⁸** |
| **Transformer (big)** | **28.4** | **41.8** | **2.3·10¹⁹** |

**What the table shows.**
- The *base* model, trained in 12 hours, beats every previous single model *and every ensemble* on EN–DE, using about 1/7 of GNMT's training FLOPs [DERIVED: 2.3e19 / 3.3e18 ≈ 7].
- The FLOP figures are the paper's own estimates: time × GPUs × sustained TFLOPS. Checking them: 12 h × 3600 × 8 × 9.5e12 = 3.28e18. 3.5 d × 86400 × 8 × 9.5e12 = 2.30e19 [DERIVED]. So the "FLOPs" column is literally the rental time of one 8-GPU box.

**Text inconsistency to avoid tripping on.** In v7, the abstract and Table 2 say **41.8** EN–FR, but section 6.1 says "achieves a BLEU score of **41.0**". Use **41.8** (the table and abstract), or avoid the EN–FR number entirely.

**Generalisation.** A 4-layer transformer with d_model = 1024 reached **91.3 F1** on WSJ constituency parsing trained only on about 40K WSJ sentences, and **92.7** semi-supervised (Table 4) [S1].

### 5.4 Why it beat RNNs and LSTMs: the paper's Table 1 [VERIFIED-PRIMARY]

n = sequence length, d = representation size, k = kernel size, r = neighbourhood.

| Layer type | Complexity per layer | Sequential operations | Maximum path length |
|---|---|---|---|
| **Self-attention** | O(n²·d) | **O(1)** | **O(1)** |
| Recurrent | O(n·d²) | O(n) | O(n) |
| Convolutional | O(k·n·d²) | O(1) | O(log_k n) |
| Self-attention (restricted) | O(r·n·d) | O(1) | O(n/r) |

**Three reasons, in the film's language:**
1. **Parallelism.** An RNN needs n steps in a row: "If you have a thousand words, you have to wait for a thousand cycles" (Polosukhin [S4]). Self-attention needs a constant number of steps; all words are processed at once, as matrix multiplications, the one thing GPUs "do… really well" (Gomez [S4]).
2. **Path length.** For an RNN to connect word 1 to word 50, the signal must survive 49 hand-offs. In self-attention every pair is one hop apart, and "the shorter these paths… the easier it is to learn long-range dependencies" [S1].
3. **Cost.** Self-attention is cheaper than recurrence per layer when n < d. That held for sentences in 2017, with n in the tens and d = 512 [S1].

**The catch the paper admits.** Cost grows with **n²**, which is why the paper floated "restricted" local attention for long inputs. That n² wall became the central engineering problem of long-context models in later years.

### 5.5 Comparison with Bahdanau attention (2014) [S6][S1]

- **Bahdanau et al.:** "the use of a fixed-length vector is a bottleneck", so the decoder should "(soft-)search for parts of a source sentence that are relevant" [S6]. The attention *score* came from a small feed-forward network ("additive attention"), and it sat **on top of** a bidirectional RNN encoder and an RNN decoder.
- **The Transformer:** (a) replaced additive scoring with a **dot product**, scaled by 1/√d_k, which is "much faster and more space-efficient in practice, since it can be implemented using highly optimized matrix multiplication code" [S1]; (b) used attention **within** the input and **within** the output (self-attention), not just between them; (c) used **many heads**; and (d) **deleted the RNN**.
- **Analogy for the film:** Bahdanau gave the slow reader (the RNN) a highlighter. The Transformer fired the slow reader and kept the highlighter, eight of them in fact.

### 5.6 A Q/K/V worked example for animation [DERIVED, our own toy numbers; not from any paper]

The example is built on Google's own illustration [S5]: in "I arrived at the bank after crossing the river", the Transformer "can learn to immediately attend to the word 'river'" when representing "bank".

**Setup.** Four tokens: `crossed`, `the`, `river`, `bank`. Toy dimension d_k = 4. We compute the new representation of **"bank"**.
- Query of "bank": **q = [1, 1, 0, 1]**
- Keys:
  - `crossed` = [1, 0, 0, 1]
  - `the` = [0, 0, 0, 0]
  - `river` = [2, 1, 0, 1]
  - `bank` = [1, 1, 0, 0]
- Values, as one-hot "meaning channels" ordered [action, water, finance, spare]: `crossed` = [1, 0, 0, 0] (action), `the` = [0, 0, 0, 0], `river` = [0, 1, 0, 0] (water), `bank` = [0, 0, 1, 0] (finance).

**Step 1: dot products q·k.** crossed = 2, the = 0, **river = 4**, bank = 2.

**Step 2: scale by √4 = 2.** The scores become [1.0, 0.0, 2.0, 1.0].

**Step 3: softmax.** Weights ≈ [0.197, 0.072, **0.534**, 0.197]. They sum to 1.

**Step 4: weighted sum of the values.** Output ≈ [action 0.197, **water 0.534**, finance 0.197, spare 0].

"Bank" is now mostly river-flavoured. In a real model this vector goes on to the feed-forward layer and the next layer.

**Unscaled contrast.** Skipping step 2 gives weights ≈ [0.105, 0.014, 0.776, 0.105]. That is sharper here. At d_k = 64 the unscaled version saturates to nearly one-hot (the 0.9997 example in 5.2). Use this to animate *why* the √d_k matters.

**Multi-head version for animation.** Show the same sentence through two heads. Head 1 behaves as above (word sense). Head 2's query from `bank` matches `crossed` (which verb governs me?). Concatenate the outputs, then project. Label this clearly as illustrative.

**Mask animation.** In a decoder generating "the river bank", the position for `river` may see only `the` and itself. Entries for later positions are greyed and set to −∞ before the softmax, which drives their weights to exactly 0.

### 5.7 Real attention pictures from the paper (Figures 3–5) [VERIFIED-PRIMARY]

- **Figure 3.** Encoder self-attention, layer 5 of 6, on the sentence: *"It is in this spirit that a majority of American governments have passed new laws since 2009 making the registration or voting process more difficult."* "Many of the attention heads attend to a distant dependency of the verb 'making', completing the phrase 'making...more difficult'." Different heads are drawn in different colours.
- **Figure 4.** *"The Law will never be perfect, but its application should be just - this is what we are missing, in my opinion."* Two heads in layer 5 are "apparently involved in anaphora resolution": "the attentions are very sharp for this word" ("its"). That they point at "Law" and "application" is read from the figure image, not stated in the caption.
- **Figure 5.** Same sentence. "The heads clearly learned to perform different tasks."
- **Google blog [S5].** The coreference pair *"The animal didn't cross the street because it was too tired / … too wide"*. The sentence text appears only inside the blog's figure image, transcribed from the widely reproduced figure; **confirm against the image before quoting**. The blog text says that for French, where "animal" and "street" have different genders, the Transformer translated both sentences correctly, unlike the then-current Google Translate model. In one step it "clearly identified the two nouns 'it' could refer to" [S5].

### 5.8 The pretraining era: four models side by side [VERIFIED-PRIMARY unless tagged]

| | ELMo [S12] | GPT-1 [S10][S18] | BERT [S11] | GPT-2 [S13][S17] | T5 [S15] |
|---|---|---|---|---|---|
| Date | arXiv 15 Feb 2018 | blog 11 Jun 2018 | arXiv 11 Oct 2018 | blog 14 Feb 2019 | arXiv 23 Oct 2019 |
| Lab | Allen Institute for AI and UW | OpenAI | Google AI Language | OpenAI | Google |
| Network | **2-layer bi-LSTM** (4096 units, 512-dimension projections) over character CNNs. *Not a transformer.* | **12-layer decoder-only Transformer**, 768-dimensional states, 12 heads, FFN 3072 | **Encoder-only** Transformer. Base: L = 12, H = 768, A = 12, **110M**. Large: L = 24, H = 1024, A = 16, **340M** | **Decoder-only**, 48 layers, d = 1600, **1.5B** (paper: 1542M); context 1024 tokens; vocabulary 50,257 | Encoder–decoder, up to **11B** |
| Objective | Forward + backward LM | Next-token prediction (left to right), then fine-tune | **Masked LM**: hide 15% of tokens (80% replaced by [MASK]) and predict them, plus next-sentence prediction | Next-token prediction only; zero-shot tasks | Fill in masked spans; every task is text-in, text-out |
| Data | 1B Word Benchmark ("After training for 10 epochs on the 1B Word Benchmark"; VERIFIED-PRIMARY) | **BooksCorpus**: "over 7,000 unique unpublished books" (Adventure, Fantasy, Romance…) | BooksCorpus (800M words) + English Wikipedia (2,500M words) | **WebText**: outbound Reddit links with ≥3 karma; 45M links, giving "slightly over 8 million documents for a total of 40 GB" (Wikipedia removed) | **C4** (Colossal Clean Crawled Corpus) from Common Crawl, "about 750 GB" |
| Compute | — | "1 month on 8 GPUs" (blog) | Base: 4 Cloud TPUs (16 chips). Large: 16 Cloud TPUs (64 chips). "Each pretraining took 4 days" | not stated in the paper | TPU v3 Pod slices (a Pod is 1,024 chips) |
| Headline result | State of the art on 6 tasks | State of the art on 9 of 12 tasks; +8.9% on Story Cloze, +5.7% on RACE | 11 tasks; GLUE **80.4 (+7.6) in v1, 11 Oct 2018**; 80.5 (+7.7) in v2, 24 May 2019; SQuAD 1.1 F1 93.2 | State of the art on 7 of 8 LM datasets zero-shot; 55 F1 on CoQA zero-shot | State of the art on many benchmarks |

**Key lineage facts**
- **GPT-1's decoder-only design cites Google.** GPT-1 says: "we use a multi-layer Transformer decoder [34]". Reference [34] is Liu et al. 2018, *"Generating Wikipedia by Summarizing Long Sequences"*, whose authors include **Kaiser and Shazeer**. That paper says: "we introduce a decoder-only architecture that can scalably attend to very long sequences" [S10][S16]. **[VERIFIED-PRIMARY]**
- **BERT was sized to match GPT.** "BERT_BASE was chosen to have the same model size as OpenAI GPT for comparison purposes" [S11]. The difference was direction: GPT's self-attention is "constrained", so that "every token can only attend to context to its left", while BERT is bidirectional [S11].
- **GPT-2's smallest model "is equivalent to the original GPT".** Its second-smallest equals BERT-Large in size [S13].
- **GPT-2 parameter counts were relabelled.** The paper lists 117M, 345M, 762M and 1542M. OpenAI's later posts call them **124M, 355M, 774M and 1.5B (1558M)** [S13][S19][S20]. Use the release-post figures when narrating the staged release.
- **GPT-2 "unicorns" sample.** The human-written prompt: *"In a shocking finding, scientist discovered a herd of unicorns living in a remote, previously unexplored valley, in the Andes Mountains. Even more surprising to the researchers was the fact that the unicorns spoke perfect English."* The blog notes the completion took "10 tries" [S17]. **[VERIFIED-PRIMARY]**
- **Google put BERT into Search on 25 October 2019**, affecting "one in 10 searches in the U.S. in English". Pandu Nayak called it "the biggest leap forward in the past five years" [S22].

### 5.9 Decoder-only next-token prediction becomes dominant [mostly VERIFIED-PRIMARY; the synthesis is ours]

**The original Transformer had three parts:** an encoder, a decoder, and attention between them. The pretraining era split it:
- **Encoder-only (BERT):** best at *understanding* and classification in 2018–19.
- **Encoder–decoder (T5):** text-to-text.
- **Decoder-only (GPT):** pure next-token prediction.

**Decoder-only won as the general form.** Three reasons, each sourced:
- **One objective.** "Predict the next word, given all of the previous words within some text" [S17]. It uses every token of raw text as a training signal and needs no masking scheme.
- **The same model generates.** That makes it a natural chat and agent interface.
- **Scale.** It improved "in a log-linear fashion" with size [S13].

The GPT-2 paper's thesis, "language models are unsupervised multitask learners", is the seed of GPT-3, ChatGPT and their successors (separate dossiers). *Phrase this as "became the dominant form", not "was proven superior"; see section 8.*

### 5.10 Later understanding: what attention actually does

- **Clark et al. 2019.** BERT heads attend "to the direct objects of verbs, determiners of nouns, objects of prepositions, and coreferent mentions with remarkably high accuracy" [S26].
- **Jain & Wallace 2019.** "learned attention weights are frequently uncorrelated with gradient-based measures of feature importance, and one can identify very different attention distributions that nonetheless yield equivalent predictions" [S14]. Their experiments were mostly on **BiLSTM-with-attention** classifiers, not Transformers. That is an important caveat.
- **Elhage et al. 2021 and Olsson et al. 2022 (Anthropic).** The **induction head**, first named in Elhage et al. (Dec 2021) and studied at scale in Olsson et al. (Mar 2022) [S28]:
  - **What it is.** "a circuit whose function is to look back over the sequence for previous instances of the current token (call it A), find the token that came after it last time (call it B), and then predict that the same completion will occur again", in the pattern **[A][B] … [A] → [B]**.
  - **How it is built.** It takes two heads in different layers. First, a **"previous token head"** "copies information from the previous token into the next token". Then the induction head "uses that information to find tokens preceded by the present token".
  - **The phase change.** It forms in a sudden **phase change** early in training, "visible as a bump in the training loss", in models "of every size (provided they have more than one layer)".
  - **The claim.** Induction heads may be "the mechanism for the actual majority of all in-context learning in large transformer models".
  - **The authors' own caveats.** The evidence is "preliminary and indirect" and "stronger for small models than for large ones".
- **Animation idea.** Text: "Mr and Mrs Dursley … Mrs" → the model predicts "Dursley". (Olsson et al. do use a Harry Potter passage, noting "Mrs" followed by "Dursley" in their phase-change analysis.) Show the previous-token head stamping each token with "I came after X", then the induction head searching for "came after Mr" and copying what followed. *Our own illustrative example; not quoted from the paper.*

---

## 6. Verified quotes

All quotes below are verbatim from the source as fetched on 2026-10-05.

**From the paper [S1]: https://arxiv.org/abs/1706.03762**
1. "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely." (Abstract, 2017)
2. "Equal contribution. Listing order is random." (Author footnote)
3. "We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients." (§3.2.1)
4. "As side benefit, self-attention could yield more interpretable models." (§4)
5. "We are excited about the future of attention-based models and plan to apply them to other tasks. We plan to extend the Transformer to problems involving input and output modalities other than text and to investigate local, restricted attention mechanisms to efficiently handle large inputs and outputs such as images, audio and video." (§7, Conclusion)
6. "This hurts perplexity, as the model learns to be more unsure, but improves accuracy and BLEU score." (on label smoothing, §5.4)

**From Wired, Steven Levy, 20 March 2024 [S3]: https://www.wired.com/story/eight-google-employees-invented-modern-ai-transformers-paper/**
Context: interviews conducted by Levy in 2023–24, recalling 2016–17.

7. Llion Jones, on the title: "I'm British… It literally took five seconds of thought. I didn't think they would use it."
8. Jakob Uszkoreit: "The methods we were applying were basically Band-Aids… We could not get the right stuff to really work at scale."
9. Uszkoreit, on self-attention: "It actually considers everything and gives you an efficient way of looking at many inputs at the same time and then taking something out in a pretty selective way."
10. Uszkoreit: "People raised their eyebrows, because it dumped out all the existing neural architectures." And: "From dinner-table conversations I had with my dad, we weren't necessarily seeing eye to eye."
11. Uszkoreit, on the name: "I had two little Transformer toys as a very young kid."
12. Noam Shazeer: "I remember Ashish was talking about the idea of using self-attention, and Niki was very excited about it. I'm like, wow, that sounds like a great idea. This looks like a fun, smart group of people doing something promising."
13. Shazeer: "I took the basic idea and made the thing up myself."
14. Aidan Gomez: "There was every possible combination of tricks and modules—which one helps, which doesn't help. Let's rip it out. Let's replace it with this… Why is the model behaving in this counterintuitive way? Oh, it's because we didn't remember to do the masking properly. Does it work yet? OK, move on to the next."
15. Jones: "Noam is a wizard."
16. Vaswani: "Ultimately, like with the human brain, you need to unite all these modalities—speech, audio, vision—under a single architecture… I had a strong hunch we were onto something more general."
17. Niki Parmar: "The English-French numbers came, like, five minutes before we submitted the paper… I was sitting in the micro-kitchen in 1965, getting that last number in."
18. Parmar, on the reviews: "One was positive, one was extremely positive, and one was, 'This is OK.'"
19. Uszkoreit, on the NIPS poster session: "Security had to tell us to leave."
20. Mat Kelcey: "I told him, 'I'm not sure that's going to work,' which is basically the biggest incorrect prediction of my life."
21. Geoffrey Hinton (to Levy): "Without transformers I don't think we'd be here now."
22. Uszkoreit: "Realistically, we could have had GPT-3 or even 3.5 probably in 2019, maybe 2020. The big question isn't, did they see it? The question is, why didn't we do anything with the fact that we had seen it? The answer is tricky."
23. Sam Altman (to Levy, 2023): "When the transformer paper came out, I don't think anyone at Google realized what it meant."
24. Shazeer, joking, that if he had known how famous the paper would become he "might have worried more about the author order." (partial quote)

**From The New Yorker, Stephen Marche, 23 August 2024 [S4]: https://www.newyorker.com/science/annals-of-artificial-intelligence/was-linguistic-ai-created-by-accident**

25. Vaswani to Gomez, spring 2017, about 3 a.m.: "This is going to be a huge deal." Gomez: "It's just machine translation… Isn't this just what research is?" Vaswani: "No, this is bigger." (As recalled to Marche. Treat as remembered dialogue, not a transcript.)
26. Gomez, on the generated Wikipedia articles: "I was shocked, blown away… I thought we would get to something like this in twenty years, twenty-five years, and then it just showed up."
27. Polosukhin: "It would work one word at a time… Read one word, process it. Read next word, process it. Read next word, process it. If you have a thousand words, you have to wait for a thousand cycles."
28. Gomez: "The chips we use, they do one thing really well, and that is matrix multiplication."
29. Vaswani: "How do you know you're purely sequential?" … "why should you impose your restrictions on a machine?"
30. Parmar: "Facebook had put out this paper before us, and that was the number we were trying to beat, and it had taken them days to train, and for us it had been a matter of hours." And: "Jakob had some old champagne in his car."
31. Gomez: "You don't prescribe what relationships it learns; you don't say, 'Your job is to learn associations of adjectives to nouns'… You just give it the ability to learn whatever it wants."
32. Vaswani: "I think that even talking about 'understanding' is something we are not prepared to do… We have only started to define what it means to understand these models."
33. Uszkoreit: "As we build these machines, we are bound to lose the ability to conceptualize what's going on, the ability to interpret. And there might be no other way."
34. Kaiser: "transformers yield very good and predictable results when scaling up their size." (partial quote)
35. Shazeer: a passage of text is "a thousand times as dense" as a picture. (partial quote)

**From OpenAI's announcements**

36. GPT-2, 14 Feb 2019 [S17] (archived: https://web.archive.org/web/2019021500id_/https://blog.openai.com/better-language-models/): "Due to our concerns about malicious applications of the technology, we are not releasing the trained model. As an experiment in responsible disclosure, we are instead releasing a much smaller model for researchers to experiment with, as well as a technical paper."
37. Same post: "GPT-2 is trained with a simple objective: predict the next word, given all of the previous words within some text."
38. Same post: "GPT-2 is a direct scale-up of GPT, with more than 10X the parameters and trained on more than 10X the amount of data."
39. GPT-1 blog, 11 Jun 2018 [S18]: "Our approach requires an expensive pre-training step - 1 month on 8 GPUs. Luckily, this only has to be done once and we're releasing our model so others can avoid it."
40. 1.5B release, 5 Nov 2019 [S20]: "As the final model release of GPT-2's staged release, we're releasing the largest version (1.5B parameters) of GPT-2 along with code and model weights to facilitate detection of outputs of GPT-2 models."
41. Headline, The Guardian, 14 Feb 2019 [S23]: "New AI fake text generator may be too dangerous to release, say creators". The phrase "too dangerous" does **not** appear in OpenAI's 14 Feb post [S17]. The headline attributes the framing to the creators ("say creators"); we cannot establish that the Guardian originated it, only that it was a media framing. **Contested** (see 7.4).

**From the GPT-2 debate (The Verge, James Vincent, 21 Feb 2019 [S24])**

42. Anima Anandkumar: "It's put academics at a big disadvantage." She also called the decision "Malicious BS" in a tweet. (The tweet is quoted via The Verge; the tweet itself was not fetched.)
43. Delip Rao: "The words 'too dangerous' were casually thrown out here without a lot of thought or experimentation. I don't think [OpenAI] spent enough time proving it was actually dangerous."
44. Miles Brundage (OpenAI): "We understand why some saw our announcement as exaggerated, though it's important to distinguish what we said from what others said… We tried to highlight both the current capabilities of GPT-2 as well as the risks of a broader class of systems, and we should have been more precise on that distinction."

**From the interpretability papers**

45. Jain & Wallace, 2019 [S14]: "Our findings show that standard attention modules do not provide meaningful explanations and should not be treated as though they do."
46. Wiegreffe & Pinter, 2019 [S27]: "prior work does not disprove the usefulness of attention mechanisms for explainability."
47. Olsson et al., 2022 [S28]: induction heads might be "the mechanism for the actual majority of all in-context learning in large transformer models", with evidence that is "preliminary and indirect".

**UNVERIFIED — do not use as quotes**
- Any line attributed to a Transformer author on the curtain "neuron pattern" beyond the paraphrase in Wired and The New Yorker. The curtain detail itself is verified as paraphrase [S3][S4].
- Claims that Polosukhin was inspired by the film *Arrival* (aliens writing whole sentences at once). We recall this from the FT's July 2023 feature, which was paywalled and **not read**. UNVERIFIED.
- "GPT-2 was too dangerous to release" attributed to OpenAI. This is a media paraphrase (e.g. the Guardian headline); OpenAI wrote "concerns about malicious applications" [S17][S23].
- Any quotation of Parmar saying they toasted "with warm bubbly beside the dusty vehicle". That is Stephen Marche's narration in The New Yorker, not Parmar's words; her quoted line is only "Jakob had some old champagne in his car." [S4]
- "Gomez produced some diagrams for the paper" as a Wired quote. Wired's wording is "produced the visualizations and diagrams for the paper" [S3].
- "Attention is all you need" as a *claim* by the authors that attention suffices for intelligence. It is a Beatles-pun title chosen in "five seconds" [S3], and the architecture includes feed-forward layers, residuals and normalisation.

---

## 7. Debates and controversies

1. **Who deserves credit, and does author order mean anything?** The paper itself answers with "Listing order is random" and a detailed per-person contribution footnote [S1]. Shazeer: "I wasn't thinking about it" [S3]. The team "decided to 'sabotage' the convention of ranking contributors" [S3]. *Film note:* do not call Vaswani "the inventor" because he is listed first. Uszkoreit proposed the idea; Shazeer devised the scaled dot-product, multi-head and positional-encoding pieces [S1].

2. **Was the Transformer new, or a recombination?** Every ingredient had precedents:
   - attention (Bahdanau 2014);
   - self-attention and intra-attention (Cheng et al. 2016; Parikh et al. 2016; Lin et al. 2017);
   - memory networks;
   - residuals (ResNet) and layer norm (Ba, Kiros & Hinton 2016) [S1 §2, refs].

   The paper's own claim is narrow: "the first transduction model relying entirely on self-attention" [S1]. The novelty is the subtraction plus the engineering (Uszkoreit: it needs "a small number of experienced 'magicians'" [S3]).

   A **contested priority claim** exists. Jürgen Schmidhuber argues that 1991-era "fast weight programmers" are mathematically equivalent to *linear* (unnormalised) self-attention. *Side 1:* Schmidhuber's own blog and the paper Schlag, Irie & Schmidhuber 2021, "Linear Transformers Are Secretly Fast Weight Programmers" (https://arxiv.org/abs/2102.11174). *Side 2:* the softmax attention and full architecture of 2017 are mainstream credited to Vaswani et al. [S1][S3]. **[VERIFIED-SECONDARY for the existence of the claim; arXiv not re-fetched]** Present it, if at all, as a claim.

3. **Did Google "miss" its own invention?**
   - *One side:* Altman: "I don't think anyone at Google realized what it meant" [S3]. Gomez (to the FT, via Wired): "They weren't modernizing. They weren't adopting this tech." [S3]. Uszkoreit: "why didn't we do anything with the fact that we had seen it?" [S3].
   - *Other side:* Google shipped transformers in Translate (2018) and BERT in Search (2019) [S3][S22]. Pichai: "we can do more after people had seen how it works" [S3]. Parmar: "Google had so much more at stake" [S3].

4. **GPT-2's staged release (Feb–Nov 2019).**
   - *For:* OpenAI cited misuse (fake news, spam) and called it "an experiment in responsible disclosure" [S17]. Brundage said releasing full models is "irreversible" [S24]. OpenAI framed staged release plus partnerships as "a key foundation of responsible publication in AI" [S19].
   - *Where the "too dangerous" phrase came from (contested):* OpenAI's post never says "too dangerous" [S17]. The Guardian's headline, "may be too dangerous to release, say creators", attributes it to OpenAI [S23], and Rao treated "too dangerous" as OpenAI's words [S24]. Brundage replied that "it's important to distinguish what we said from what others said" [S24]. The Guardian body does report that OpenAI said the risk of malicious use was "so high" that it broke from normal practice [S23]. Film wording: "the press called it 'too dangerous to release'", not "OpenAI called it" and not "the Guardian invented it".
   - *Against:* Anandkumar said it disadvantages academics and that limiting access won't solve misinformation [S24]. Rao said the danger was "casually thrown out… without a lot of thought or experimentation" [S24]. The Verge reported researchers turning it into a meme ("too dangerous to share") [S24].
   - *Outcome:* the 1.5B model was released on 5 Nov 2019. OpenAI wrote: "We’ve seen no strong evidence of misuse so far." [S20] [VERIFIED-PRIMARY] Its Cornell partners found human-rated "credibility" scores of 6.91 (1.5B), 6.72 (774M) and 6.07 (355M) out of 10 [S20] [VERIFIED-PRIMARY for the scores].
   - *How long it mattered:* the debate prefigured later arguments over open versus closed weights (separate dossiers).

5. **Is attention an explanation?** Jain & Wallace (no) [S14], Wiegreffe & Pinter (it depends on the definition; not disproven) [S27], Clark et al. (heads do track syntax) [S26]. The mechanistic-interpretability programme reframed the question: look at circuits made of heads and MLPs, not at single heatmaps [S28]. The issue is still open; induction-head evidence for *large* models is "preliminary and indirect" [S28].

6. **"Understanding."** Even the authors disagree on whether transformers "understand". Vaswani: "we are not prepared to do" that; Uszkoreit: such systems "will, almost by definition, elude our understanding of them" [S4]. The Verge's 2019 description of GPT-2 is "It generates text but doesn't understand it" [S24]. Present both sides and do not adjudicate.

---

## 8. Misconceptions to avoid

1. **"The Transformer invented attention."** No. Attention for neural translation is Bahdanau, Cho & Bengio 2014 [S6]. The Transformer removed the RNN and made *self*-attention the whole engine [S1].
2. **"Attention is ALL it uses."** Each layer also has a feed-forward network (two-thirds of the parameters in an encoder layer [DERIVED]), residual connections, layer norm, embeddings and positional encodings [S1]. The title is a Beatles pun [S3].
3. **"The Transformer was designed to be a chatbot or GPT."** It was built and evaluated for **machine translation** (plus parsing), as an **encoder–decoder** [S1]. GPT's decoder-only form came via Liu et al. 2018 and OpenAI [S16][S10].
4. **"The first author is the inventor."** Order is random by the paper's own footnote [S1].
5. **"BERT is a GPT-style generator."** BERT is encoder-only and bidirectional, trained by *masked* language modelling. It is not a text generator in the GPT sense [S11].
6. **"ELMo was a transformer."** ELMo used bidirectional LSTMs [S12].
7. **"OpenAI said GPT-2 was 'too dangerous to release'."** The phrase is not in OpenAI's post; it was a press framing, prominently the Guardian's headline, which attributed it to the creators. OpenAI's words: "concerns about malicious applications" [S17][S23]. GPT-2 was also *eventually* released in full (5 Nov 2019) [S20].
8. **"GPT-2 had 1.5B parameters, and the smallest had 117M."** Both numbers appear in the paper, but OpenAI later relabelled the sizes as 124M / 355M / 774M / 1558M [S13][S19][S20]. Be consistent within the film.
9. **"EN–FR score 41.0."** v7 of the paper contains both 41.0 (§6.1 text) and 41.8 (abstract and Table 2) [S1]. Use 41.8 or omit it.
10. **"Trained on a supercomputer."** The original was trained on **one machine with 8 P100 GPUs** [S1]. BERT-Large used 64 TPU chips for 4 days [S11]; GPT-1 used 8 GPUs for a month [S18].
11. **"Positional encodings are learned in the original."** The original used fixed sinusoids. Learned ones performed "nearly identical[ly]" [S1].
12. **"Transformers process words in order."** Within a layer, all positions are computed in parallel. Order enters only through the added positional encodings (and the decoder's causal mask) [S1].
13. **"The original Transformer is the pre-LN design used today."** The paper uses LayerNorm(x + Sublayer(x)), the "post-LN" form [S1]. Many later models moved the norm before the sub-layer. *Do not draw modern pre-LN as "the 2017 design".* (The pre-LN claim is VERIFIED-SECONDARY general knowledge; e.g. Xiong et al. 2020, https://arxiv.org/abs/2002.04745, not re-fetched.)
14. **"Attention maps show what the model is thinking."** Contested [S14][S27]. Present heatmaps as *clues*, not explanations.
15. **"All eight authors are still away from Google" / "Shazeer is back at Google."** Wired (March 2024) said all eight had left [S3]. Shazeer was rehired by Google in August 2024 [S25] and left again for OpenAI in June 2026 [S29][S37]. As of 2026-10-05 none of the eight is reported at Google. Vaswani's reported 2026 Nvidia move remains UNVERIFIED.
16. **"Gomez was a PhD student."** He was an undergraduate intern (a University of Toronto "junior" when he joined Hinton's lab) aged 20 [S3][S4] (later an Oxford PhD per Wikipedia [LEAD]).
17. **"The Transformer's design came from a single eureka moment."** Gomez describes "extremely high-paced, iterative trial and error" over ablations [S3]. The New Yorker says the team was "pushing flat out for twelve weeks" [S4].
18. **"Olsson et al. 2022 discovered induction heads."** They were first named in Elhage et al., Dec 2021; Olsson et al. tied them to in-context learning [S28].
19. **"ELMo was the first pretrained contextual language model."** CoVe (Aug 2017) and ULMFiT (Jan 2018) came earlier [S35].

---

## 9. Curiosity hooks (surprising, true, sourced)

1. **The title took "five seconds".** Llion Jones, the Welshman, borrowed it from the Beatles' "All You Need Is Love" a couple of nights before the deadline: "I didn't think they would use it." [S3]
2. **The name came partly from childhood toys.** Per Uszkoreit, the design-doc trio (Uszkoreit, Polosukhin, Vaswani) picked "Transformers" from "day zero", because the mechanism would *transform* the information it took in. "Plus", Wired adds, Uszkoreit had "two little Transformer toys as a very young kid", and the design document ended with a cartoon of six Transformers zapping lasers at each other in mountainous terrain [S3].
3. **The order of the eight names is literally random.** The footnote says so, then lists who did what [S1].
4. **The English–French result arrived about five minutes before submission.** The paper went in "with barely two minutes to spare" [S3].
5. **The intern couldn't legally celebrate.** Aidan Gomez was 20, too young to drink in the US, when he co-wrote the paper that underlies ChatGPT. He later learned the internship was meant for PhD students [S3][S4].
6. **The model hallucinated its own namesake.** Trained on Wikipedia, it invented five articles called "The Transformer": a Japanese hardcore-punk band "formed in 1968" that later reformed as "Starmirror", a novel by a fictional "Herman Muirhead", a 2013 Australian sitcom, and more. "I was shocked, blown away," Gomez said [S4].
7. **The LSTM's inventor came to praise it.** At the packed NIPS poster session, which ran until security cleared the room at 10:30 pm, Sepp Hochreiter, co-inventor of the LSTM the Transformer was replacing, praised the work [S3].
8. **The whole record-breaking run cost one box for half a day.** The base Transformer beat every previous English–German system, ensembles included, after **12 hours on one 8-GPU machine**. By the paper's own accounting that is about 7 times less compute than Google's own production-style GNMT [S1] [DERIVED ratio].
9. **GPT's blueprint came from Google.** OpenAI's GPT-1 says it uses "a multi-layer Transformer decoder [34]". Reference 34 is a Google paper co-written by two of the eight, Kaiser and Shazeer [S10][S16].
10. **The champagne in the truck.** A couple of weeks before the deadline, Parmar and Vaswani learned in the Google lobby that the model had passed 26 BLEU and phoned Uszkoreit, who was driving his four-by-four down from paragliding. Wired: he "broke out an old bottle of champagne he had lying around in his mountain expedition truck" [S3]. Parmar: "Jakob had some old champagne in his car." The New Yorker's narration (not a quote from Parmar) has them toasting "with warm bubbly beside the dusty vehicle in the company parking lot" [S4].
11. **A father-son argument.** Hans Uszkoreit, the eminent computational linguist and former East German political prisoner, doubted the idea at the dinner table. He later co-founded a company building large language models, "using transformers, of course" [S3].
12. **GPT-2 learned from Reddit's taste.** Its 40 GB of text came from web pages that Reddit users had linked and upvoted at least 3 karma, "a heuristic indicator for whether other users found the link interesting, educational, or just funny" [S13].
13. **Why divide by √64 = 8.** Without it, a 64-dimensional dot product has a typical size of ±8. The softmax then freezes into a hard choice and gradients vanish. That one division is in the formula on every slide about transformers [S1] [DERIVED illustration].

---

## 10. Visual and dramatic details (for the art department and the story)

**Places**
- **Google, Mountain View, California. Buildings 1945 and 1965 on Charleston Road**, at the northern edge of the campus, named after their street addresses [S3]. The team mostly worked in **1965** because it had the better **espresso machine in the micro-kitchen** [S3].
  - Uszkoreit's **whiteboards** in 1945 [S3].
  - A **Google café** where Uszkoreit and Polosukhin had lunch [S3].
  - A **corridor in 1965** past Kaiser's workspace, where Shazeer overheard the conversation [S3].
  - A **second-floor room in 1965** with **office couches by a curtain** whose fabric pattern looked to Vaswani "like synapses and neurons" [S3][S4]. *A natural silhouette set:* curtain fabric as a glowing neural net, a figure asleep on a couch, a laptop glow, at 3 a.m. [S4].
  - The **micro-kitchen in 1965**, where Parmar got "that last number in" minutes before the deadline [S3].
  - The **Google lobby**, where Parmar and Vaswani learned the BLEU was over 26 [S4].
  - The **company parking lot**: a dusty four-by-four, warm champagne. Uszkoreit had just driven down from **paragliding in the mountains** [S4][S3].
- **Season and weather.** "As what passes for winter in Silicon Valley shifted to spring" [S3], meaning February to May 2017. Northern California spring: green hills, clear, mild. The deadline was **19 May 2017** [S3].
- **Long Beach, California, NIPS 2017.** An evening poster session on **6 December 2017**: four hours, jammed, authors "talked until they were hoarse", still crowded at 10:30 pm, cleared by security [S3]. Visual: a convention-hall poster board, a sea of silhouetted heads, one older figure (Hochreiter) stepping forward.
- **Elsewhere:**
  - **Toronto.** Gomez back at school, opening an email titled "Generated Wikipedia Articles" [S4].
  - **Seattle** (Allen Institute for AI, ELMo; Google's Seattle office, BERT) [S11][S12].
  - **San Francisco**, OpenAI, 2018–19 [S17][S18].

**Objects and period details (2016–2019)**
- **Hardware:** NVIDIA **P100** GPUs, eight to a server (2017) [S1]; Google **Cloud TPUs** in pods (BERT, T5) [S11][S15].
- **Laptops and terminals:** TensorFlow and **Tensor2Tensor** code on screen [S1][S5].
- **The design document:** "Transformers: Iterative Self-Attention and Processing for Various Tasks", with a cartoon of six Transformers zapping lasers in the mountains, and the line "We are awesome." [S3]. Do not reproduce Hasbro characters (trademark). Use generic robot silhouettes.
- **The paper's Figure 1:** the iconic two-tower diagram, with the encoder on the left (N×) and the decoder on the right (N×), and stacked boxes labelled "Multi-Head Attention", "Add & Norm", "Feed Forward" and "Positional Encoding" (wave symbol) [S1]. Wired says Gomez "produced the visualizations and diagrams for the paper" [S3] (the paper's own footnote credits Jones with "visualizations" [S1]). It is fine to re-draw it in paper-cut style. The v7 PDF carries a Google permission note allowing reproduction of its tables and figures "solely for use in journalistic or scholarly works" [S1]. Check with counsel whether an educational film qualifies; re-drawing is safer.
- **Attention heatmaps and arc diagrams** in Figures 3–5: coloured lines from "making" to "more difficult", and sharp lines from "its" to "Law" [S1]. These suit silhouette "string" art: threads of light between paper word-tiles.
- **The GPT-2 unicorns:** a paper-cut Andes valley with unicorns, framed as *machine-written fiction* [S17].
- **The 2019 news cycle:** a Guardian headline on a phone screen [S23] and a meme-like chorus of researchers [S24].

**Dramatic beats (all sourced)**
1. **The doubters.** A father at the dinner table [S3]; Kelcey's "I'm not sure that's going to work" [S3].
2. **The plateau.** "It wasn't better" than LSTMs until Shazeer arrived [S3].
3. **The wizard.** Shazeer rewrites the code alone: "Look, it works." [S3]
4. **The sprint.** Ablations, "People weren't sleeping", the masking bug [S3].
5. **The 3 a.m. couch prophecy.** Vaswani tells Gomez "No, this is bigger" [S4].
6. **The five-second title** [S3].
7. **Two minutes to spare** [S3].
8. **The hoarse poster session**, and the LSTM inventor's praise [S3].
9. **The scatter.** All eight leave Google; seven found companies [S3].

**Animation recipes (mechanics)**
- **Self-attention:** paper word-tiles on a stage; from each tile, three cut-out cards (Q, K, V) [S1 terms]; strings of light whose thickness equals the softmax weight; the new tile is a blended colour.
- **Multi-head:** eight coloured string-sets on the same tiles, matching the paper's "Different colors represent different heads" [S1].
- **Positional encoding:** a row of tiles each wearing a striped "barcode" of sine waves at increasing wavelengths [S1].
- **Causal mask:** a triangular black cut-out curtain dropping over future tiles.
- **RNN vs Transformer race:** an RNN as a single lamplighter walking word to word (n steps); the Transformer as all lamps lighting at once (constant steps) [S1 Table 1].
- **Induction head:** a two-step relay. A previous-token head stamps each tile with its predecessor; then the induction head finds the earlier match and copies its successor [S28].

---

## 11. Sources

1. [S1] Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin, "Attention Is All You Need", NIPS 2017; arXiv:1706.03762v7 PDF. https://arxiv.org/pdf/1706.03762v7 (proceedings: https://papers.nips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf)
2. [S2] arXiv abstract page and submission history for 1706.03762. https://arxiv.org/abs/1706.03762
3. [S3] Steven Levy, "8 Google Employees Invented Modern AI. Here's the Inside Story", WIRED, 20 March 2024. https://www.wired.com/story/eight-google-employees-invented-modern-ai-transformers-paper/ (archive: https://web.archive.org/web/20240320101528/https://www.wired.com/story/eight-google-employees-invented-modern-ai-transformers-paper/)
4. [S4] Stephen Marche, "Was Linguistic A.I. Created by Accident?", The New Yorker, 23 August 2024. https://www.newyorker.com/science/annals-of-artificial-intelligence/was-linguistic-ai-created-by-accident (archive: https://web.archive.org/web/20240823103934/https://www.newyorker.com/science/annals-of-artificial-intelligence/was-linguistic-ai-created-by-accident)
5. [S5] Jakob Uszkoreit, "Transformer: A Novel Neural Network Architecture for Language Understanding", Google Research Blog, 31 August 2017. https://research.google/blog/transformer-a-novel-neural-network-architecture-for-language-understanding/
6. [S6] Bahdanau, Cho, Bengio, "Neural Machine Translation by Jointly Learning to Align and Translate", arXiv:1409.0473 (1 Sep 2014; ICLR 2015). https://arxiv.org/abs/1409.0473
7. [S7] Hochreiter & Schmidhuber, "Long Short-Term Memory", Neural Computation 9(8), 1997. https://doi.org/10.1162/neco.1997.9.8.1735
8. [S8] Sutskever, Vinyals, Le, "Sequence to Sequence Learning with Neural Networks", arXiv:1409.3215. https://arxiv.org/abs/1409.3215
9. [S9] Wu et al., "Google's Neural Machine Translation System", arXiv:1609.08144. https://arxiv.org/abs/1609.08144 ; Gehring et al., "Convolutional Sequence to Sequence Learning", arXiv:1705.03122. https://arxiv.org/abs/1705.03122
10. [S10] Radford, Narasimhan, Salimans, Sutskever, "Improving Language Understanding by Generative Pre-Training", OpenAI, 2018. https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf
11. [S11] Devlin, Chang, Lee, Toutanova, "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", arXiv:1810.04805 (11 Oct 2018). https://arxiv.org/abs/1810.04805
12. [S12] Peters et al., "Deep contextualized word representations" (ELMo), arXiv:1802.05365 (15 Feb 2018; NAACL 2018). https://arxiv.org/abs/1802.05365
13. [S13] Radford, Wu, Child, Luan, Amodei, Sutskever, "Language Models are Unsupervised Multitask Learners", OpenAI, 2019. https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf
14. [S14] Jain & Wallace, "Attention is not Explanation", arXiv:1902.10186 (26 Feb 2019; NAACL 2019). https://arxiv.org/abs/1902.10186
15. [S15] Raffel et al., "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer" (T5), arXiv:1910.10683 (23 Oct 2019). https://arxiv.org/abs/1910.10683
16. [S16] Liu, Saleh, Pot, Goodrich, Sepassi, Kaiser, Shazeer, "Generating Wikipedia by Summarizing Long Sequences", arXiv:1801.10198 (30 Jan 2018; ICLR 2018). https://arxiv.org/abs/1801.10198
17. [S17] OpenAI, "Better Language Models and Their Implications", 14 Feb 2019. Archived: https://web.archive.org/web/2019021500id_/https://blog.openai.com/better-language-models/ (current: https://openai.com/index/better-language-models/)
18. [S18] OpenAI, "Improving Language Understanding with Unsupervised Learning", 11 Jun 2018. Archived: https://web.archive.org/web/2018061200id_/https://blog.openai.com/language-unsupervised/ (current: https://openai.com/index/language-unsupervised/)
19. [S19] OpenAI, "GPT-2: 6-Month Follow-Up", 20 Aug 2019. Archived: https://web.archive.org/web/2019082100id_/https://openai.com/blog/gpt-2-6-month-follow-up/
20. [S20] OpenAI, "GPT-2: 1.5B Release", 5 Nov 2019. Archived: https://web.archive.org/web/2019110600id_/https://openai.com/blog/gpt-2-1-5b-release/
21. [S21] Ba, Kiros, Hinton, "Layer Normalization", arXiv:1607.06450. https://arxiv.org/abs/1607.06450 ; Parikh, Täckström, Das, Uszkoreit, "A Decomposable Attention Model for Natural Language Inference", EMNLP 2016. https://arxiv.org/abs/1606.01933
22. [S22] Pandu Nayak, "Understanding searches better than ever before", Google (The Keyword), 25 Oct 2019. https://blog.google/products/search/search-language-understanding-bert/
23. [S23] Alex Hern, "New AI fake text generator may be too dangerous to release, say creators", The Guardian, 14 Feb 2019. https://www.theguardian.com/technology/2019/feb/14/elon-musk-backed-ai-writes-convincing-news-fiction
24. [S24] James Vincent, "AI researchers debate the ethics of sharing potentially harmful programs", The Verge, 21 Feb 2019. https://www.theverge.com/2019/2/21/18234500/ai-ethics-debate-researchers-harmful-programs-openai
25. [S25] Alex Heath, The Verge, 2 Aug 2024, on Google hiring Character.AI's founders. https://www.theverge.com/2024/8/2/24212348/google-hires-character-ai-noam-shazeer ; Reuters, 23 Aug 2024 (not read; LEAD for "Gemini co-lead"). https://www.reuters.com/technology/google-appoints-former-characterai-founder-co-lead-its-ai-models-2024-08-23/
26. [S26] Clark, Khandelwal, Levy, Manning, "What Does BERT Look At? An Analysis of BERT's Attention", arXiv:1906.04341 (11 Jun 2019). https://arxiv.org/abs/1906.04341
27. [S27] Wiegreffe & Pinter, "Attention is not not Explanation", arXiv:1908.04626 (13 Aug 2019; EMNLP 2019). https://arxiv.org/abs/1908.04626
28. [S28] Olsson, Elhage, Nanda, et al. (Anthropic), "In-context Learning and Induction Heads", Transformer Circuits Thread, 8 Mar 2022. https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html ; arXiv copy https://arxiv.org/abs/2209.11895 ; Elhage et al., "A Mathematical Framework for Transformer Circuits", Dec 2021. https://transformer-circuits.pub/2021/framework/index.html
29. [S29] Wikipedia, "Noam Shazeer" (lead; cites Reuters https://www.reuters.com/technology/googles-gemini-co-lead-noam-shazeer-join-openai-2026-06-18/, which blocks automated reads). https://en.wikipedia.org/wiki/Noam_Shazeer . Corroborated at headline level by [S37].
30. [S30] Wikipedia, "Ashish Vaswani" (LEAD only; cites Axios 23 Jun 2026 https://www.axios.com/2026/06/23/ai-lab-agi-google-deepmind-departures, blocked to us). https://en.wikipedia.org/wiki/Ashish_Vaswani
31. [S31] Wikipedia, "Aidan Gomez" (LEAD only; cites NYT https://www.nytimes.com/2026/04/24/business/cohere-aleph-alpha-ai-merger.html and Axios https://www.axios.com/2026/04/24/cohere-20-billion-aleph-alpha-europe). https://en.wikipedia.org/wiki/Aidan_Gomez ; Wikipedia, "Llion Jones" (LEAD). https://en.wikipedia.org/wiki/Llion_Jones ; Wikipedia, "Attention Is All You Need" (LEAD; citation count ">250,000 as of 2026"). https://en.wikipedia.org/wiki/Attention_Is_All_You_Need
32. [S32] Schlag, Irie, Schmidhuber, "Linear Transformers Are Secretly Fast Weight Programmers", arXiv:2102.11174 (the contested priority claim). https://arxiv.org/abs/2102.11174
33. [S33] Xiong et al., "On Layer Normalization in the Transformer Architecture", arXiv:2002.04745 (pre-LN vs post-LN). https://arxiv.org/abs/2002.04745
35. [S35] Pre-ELMo pretrained contextual models: McCann et al., "Learned in Translation: Contextualized Word Vectors" (CoVe), arXiv:1708.00107 (1 Aug 2017) https://arxiv.org/abs/1708.00107 ; Howard & Ruder, "Universal Language Model Fine-tuning for Text Classification" (ULMFiT), arXiv:1801.06146 (18 Jan 2018) https://arxiv.org/abs/1801.06146 ; NAACL 2018 chairs' blog, "Outstanding Papers", 11 Apr 2018 https://naacl2018.wordpress.com/2018/04/11/outstanding-papers/
36. [S36] NIPS 2017 Call for Papers (Wayback, 1 May 2017): "Deadline for Paper Submissions: Fri May 19, 2017 20:00 PM UTC"; Long Beach Convention Center, 4–9 Dec 2017. https://web.archive.org/web/2017050100/https://nips.cc/Conferences/2017/CallForPapers
37. [S37] Google News RSS headline records (read 2026-10-05; article bodies not read): Reuters, "Google Gemini co-lead Noam Shazeer to join IPO-bound OpenAI" (17 Jun 2026); CNBC, "Google Gemini co-lead Noam Shazeer leaves for OpenAI" (17 Jun 2026); Axios, "Top AI researcher leaves Google for OpenAI" (18 Jun 2026); TechCrunch, "Why Cohere is merging with Aleph Alpha" (25 Apr 2026); PR Newswire, "Cohere and Aleph Alpha Sign Agreement…" (16 Sep 2026); Analytics India Magazine, "What Does Niki Parmar's Move to Anthropic Mean for AI?" (25 Feb 2025); Moneycontrol, "…says Anthropic's Niki Parmar" (1 Mar 2025); VentureBeat, "'Attention is All You Need' creators look beyond Transformers for AI at Nvidia GTC" (20 Mar 2024). Query endpoint: https://news.google.com/rss/search?q=Noam+Shazeer+OpenAI
34. [S34] Nature news feature, "Exclusive: the most-cited papers of the twenty-first century", 15 Apr 2025. https://www.nature.com/articles/d41586-025-01125-9 (AIAYN's rank not extracted from the page; LEAD only)

---

### Verification notes (2026-10-05)

- **Paper numbers.** All checked against the v7 PDF text: d_model, heads, layers, d_ff, dropout, warmup, BLEU, FLOPs, P100s, hours/days, dataset sizes, vocabularies, Table 1 and Table 3.
- **Wired and New Yorker quotes.** Copied from the article text as fetched.
- **OpenAI quotes.** From Wayback captures of the original blog posts.
- **Not read.** FT, July 2023 (paywall); the NVIDIA GTC 2024 panel page (404). A VentureBeat headline of 20 Mar 2024 ("'Attention is All You Need' creators look beyond Transformers for AI at Nvidia GTC") supports that a GTC panel of the authors took place; the article itself returned 404. That Jensen Huang hosted it and that seven of the eight attended remain **UNVERIFIED**.
- **Wired's internal detail check.** Wired says the "most tenured contributor, Noam Shazeer, saw an early draft" and was surprised to be listed first. The final arXiv order lists Vaswani first [S1], which is consistent with a reshuffle; we have no source for the order of any draft.

---

## 12. Fact-check log (adversarial pass, 2026-10-05)

Method: re-downloaded and text-extracted the primary sources rather than trusting the draft's citations: AIAYN v7 PDF and arXiv submission history; GPT-1, GPT-2, BERT v1 and v2, ELMo, T5, Liu et al., Clark et al., Jain & Wallace, Wiegreffe & Pinter PDFs; arXiv abstract pages for every dated preprint; the Wayback captures of OpenAI's four posts plus the May 2019 update; Wired [S3] and New Yorker [S4] archive captures; the Guardian, the Verge (2019 and 2024), the Google Research and Keyword blogs; both transformer-circuits.pub papers; the NIPS 2017 call for papers; and the NAACL 2018 chairs' blog. Post-2024 career news was checked against Google News headline records [S37] because Reuters and Axios block automated reads.

**Confirmed against primary text (no change needed):** arXiv v1 12 Jun 2017 (submitted by Llion Jones) and the v2–v7 dates; NIPS 2017, Long Beach; the footnote "Equal contribution. Listing order is random." and the whole contribution footnote verbatim; "based solely on attention mechanisms"; Eq. 1; the "extremely small gradients" sentence and footnote 4 (variance d_k); base/big hyperparameters (6+6 layers, 512/1024, 2048/4096, 8/16 heads, d_k 64, dropout 0.1, 65M/213M); 28.4 EN–DE, "by over 2 BLEU", 41.8 (abstract and Table 2) vs 41.0 (§6.1); base 27.3 beats all prior ensembles (best 26.36); 8 P100s, 100K steps/12 h and 300K/3.5 d; FLOPs 3.3e18 vs GNMT+RL 2.3e19 (≈1/7); Table 1 complexities and the n < d sentence; parsing 91.3/92.7; all six paper quotes; GPT-1 (12 layers, 768, 12 heads, 3072, "over 7,000 unique unpublished books", "1 month on 8 GPUs", blog 11 Jun 2018, ref [34] = Liu et al. with Kaiser and Shazeer); Liu et al. "decoder-only architecture" quote and 30 Jan 2018 date; BERT 110M/340M, 15% masking, 800M + 2,500M words, 64 TPU chips × 4 days, eleven tasks, "same model size as OpenAI GPT", "context to its left"; GPT-2 1542M/48 layers/1600/50,257/1024 context, 45M links, ≥3 karma, "slightly over 8 million documents", 40 GB, "log-linear", "underfits", 7 of 8, 55 F1; OpenAI quotes 36–40 verbatim; 774M on 20 Aug 2019, 1.5B on 5 Nov 2019, credibility 6.91/6.72/6.07, "no strong evidence of misuse"; Guardian headline and date; Verge quotes 42–44 verbatim; Jain & Wallace and Wiegreffe & Pinter quotes and dates; Clark et al. quote; Olsson et al. quotes, date (8 Mar 2022) and caveats; T5 750 GB / 11B / 1,024-chip pods / 23 Oct 2019; BERT-in-Search 25 Oct 2019 and "one in 10"; Google blog 31 Aug 2017 by Uszkoreit, "river" and "clearly identified" passages; every Wired quote 7–24 and every New Yorker quote 25–35 verbatim; the 6 Dec 2017 poster session, 10:30 pm, "Security had to tell us to leave", Hochreiter's praise; Gomez "only twenty"; the five generated "Transformer" articles; Wired's careers paragraph (all eight had left; Cohere 2019; Shazeer left Oct 2021; Adept 2021 then Essential AI; Sakana; Inceptive; Near; Kaiser at OpenAI); the Verge on Shazeer's August 2024 return.

**Changes made**
1. **BERT GLUE score.** The October 2018 v1 reports GLUE **80.4 (+7.6)**; 80.5 (+7.7) appears only in the v2 revision of 24 May 2019. Fixed in the summary, timeline and section 5.8 table. Sources: https://arxiv.org/pdf/1810.04805v1 ; https://arxiv.org/abs/1810.04805
2. **ELMo was not "first".** CoVe (arXiv 1 Aug 2017) and ULMFiT (arXiv 18 Jan 2018) predate ELMo's 15 Feb 2018 arXiv posting, and GPT-1 cites Dai & Le and Howard & Ruder as precedents. Added to the summary, timeline and misconceptions. The unsourced "27 Oct 2017 OpenReview" date and the "best-paper award" are replaced with the verified NAACL 2018 "Outstanding Papers" listing. Sources: https://arxiv.org/abs/1708.00107 ; https://arxiv.org/abs/1801.06146 ; https://naacl2018.wordpress.com/2018/04/11/outstanding-papers/
3. **Who found induction heads.** They were named and first described in Elhage et al. (22 Dec 2021). Olsson et al. (8 Mar 2022) write "In our previous paper, we discovered … induction heads" and link them to in-context learning. Fixed in the summary, timeline, 5.10 and misconceptions. Elhage date upgraded to VERIFIED-PRIMARY. Sources: https://transformer-circuits.pub/2021/framework/index.html ; https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html
4. **Generated-Wikipedia email timing.** The New Yorker says "Two weeks later", meaning after the 3 a.m. late-sprint conversation, not "two weeks after submission". Timeline fixed. Source: [S4]
5. **Champagne attribution.** "toasted … with warm bubbly beside the dusty vehicle" is Marche's narration, not Parmar's words. Her quote is only "Jakob had some old champagne in his car." Hook 10 rewritten, and a do-not-quote entry added. Source: [S4]
6. **Gomez's diagrams.** Wired says he "produced the visualizations and diagrams for the paper", not "some diagrams". The paper credits Jones with "visualizations". Both are now noted. Sources: [S3][S1]
7. **Naming "Transformers".** Wired: "They picked the name … from 'day zero,'" where "they" is the design-doc trio, with the toys as an added reason ("Plus Uszkoreit had fond childhood memories…"). Hook 2 no longer says Uszkoreit alone chose it because of the toys. Source: [S3]
8. **GPT-2 May 2019 model size label.** At release OpenAI called it "345M"; "355M" is the August 2019 relabel. Timeline fixed. Sources: https://web.archive.org/web/2019050600id_/https://openai.com/blog/better-language-models/ ; [S19]
9. **"Too dangerous to release" origin: CONTESTED.** The phrase is absent from OpenAI's post (verified). The Guardian headline attributes it to the creators ("say creators"), and we cannot show that the Guardian originated it. Quote 41, 7.4 and misconception 7 reworded. Sources: [S17][S23][S24]
10. **Shazeer joining date.** Wired says "one day in 2017", with no season. Changed from "Spring 2017". Source: [S3]
11. **NIPS deadline.** Fri 19 May 2017, 20:00 UTC, upgraded to VERIFIED-PRIMARY. "With barely two minutes to spare" is Wired's narration, not a quote. Source: [S36]
12. **Timeline order and dates.** Bahdanau (1 Sep 2014) now precedes Seq2Seq (10 Sep 2014). The Seq2Seq and GNMT (26 Sep 2016) dates were re-fetched and upgraded. Sources: https://arxiv.org/abs/1409.3215 ; https://arxiv.org/abs/1609.08144
13. **Shazeer's 2026 move to OpenAI.** Upgraded from LEAD to VERIFIED-SECONDARY at headline level: Reuters, CNBC and Axios, 17–18 Jun 2026. The "eight authors" status is therefore wrong to describe as "Shazeer back at Google" after June 2026. Source: [S37]
14. **Cohere and Aleph Alpha.** This is a merger, not an acquisition: announced Apr 2026, agreement signed 16 Sep 2026. Source: [S37]
15. **Parmar's move to Anthropic.** Reported by multiple outlets in Feb–Mar 2025, not "late 2024". Headline-level only, and the start date is unverified. Source: [S37]
16. **Vaswani's advisers.** Wikipedia lists David Chiang and Liang Huang (LEAD). Source: https://en.wikipedia.org/wiki/Ashish_Vaswani
17. **ELMo training data** (1B Word Benchmark) upgraded to VERIFIED-PRIMARY. Source: https://arxiv.org/abs/1802.05365
18. **Figure 4.** The caption says only that attentions are "very sharp for this word". The "Law"/"application" targets come from reading the figure. Clarified. Source: [S1]
19. **Big-model dropout.** Added that EN–FR big used P_drop 0.1, not 0.3. Source: [S1] §6.1

**Still unverifiable (left marked):** Vaswani and Essential AI "acqui-hired" by Nvidia (Jun 2026; only Wikipedia, and Axios was blocked); who hosted the GTC 2024 panel and how many authors attended (a VentureBeat headline confirms only that the panel happened); the FT-sourced *Arrival* anecdote; Shazeer's physical description and other appearance notes.

