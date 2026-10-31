# Dossier: The Gold Rush — Embeddings, Sequence Models, AlphaGo and the New Labs (2013–2017, with coda to 2019)

Topic id: `deep-learning-gold-rush` · Film: neural-net-history · As-of: 2026-10-05
Status: drafted, then a verification pass on 2026-10-05. In that pass the primary texts were downloaded and their text was searched directly. They are: arXiv PDFs of Mikolov et al. 2013a/b, Sutskever–Vinyals–Le 2014, Bahdanau–Cho–Bengio 2014, Goodfellow et al. 2014 (GAN), Mnih et al. 2013, Szegedy et al. 2013, Goodfellow–Shlens–Szegedy 2014, Wu et al. 2016 (GNMT), Marcus 2018 and Nissim et al. 2019; the NAACL 2013 paper; the Gender Shades PMLR PDF; the DeepMind-hosted Nature PDFs of DQN (2015) and AlphaGo (2016); and the UCL-hosted author manuscript of AlphaGo Zero (2017). Web pages were read in full for these: the 2015 OpenAI announcement (Wayback), the ACM 2019 press release (Wayback), Wired (2013, 2014, 2016 ×3, 2021), the Guardian (2014 ×2, 2016), Yonhap (2019), MIT Technology Review (2018), the NYT Magazine (2016, Wayback), the Google Open Source and Google Research blogs, the DeepMind AlphaGo and AlphaGo Zero pages, the NeurIPS 2023 awards blog, Yann LeCun's 2013 Facebook post (Wayback) and the TEDxBeaconStreet transcript. **Adversarial fact-check completed 2026-10-05.** All primary PDFs were re-downloaded and re-searched independently; corrections were made in place and are listed in section 13, Fact-check log. The most consequential: the 34.8 seq2seq BLEU was an **ensemble of five** LSTMs, not one; AlphaGo Zero's "single machine with 4 TPUs" is its **playing** hardware, not its training hardware; and a phrase attributed to Marcus ("the beginning of the resurgence") was a misreading.

Tags:
- **[VERIFIED-PRIMARY]**: checked in this pass against the original paper or the institution's or speaker's own text.
- **[VERIFIED-SECONDARY]**: checked in this pass against a reputable news report or reference work.
- **[KNOWLEDGE]**: drafted from general knowledge and not re-checked in this pass. Treat it as a lead and verify before narrating.
- **[UNVERIFIED]**: do not state as fact, and do not quote.

Source numbers such as [S12] refer to section 11. Neighbouring dossiers cover overlapping material: `alexnet-deep-dive` (the 2012 result and the DNNresearch auction in depth) and `transformer-deep-dive` (2017 onward). This dossier covers the gold rush **between** them.

---

## 1. Summary

After AlexNet (autumn 2012), deep learning stopped being a research bet and became an industrial land grab. Over the next five years, the same recipe moved into one domain after another. The recipe: large neural networks, trained end to end on large data with GPUs (later TPUs), replacing hand-engineered features. Image recognition came first, then words, translation, video games, image generation and the game of Go.

**Words became geometry (2013).** Tomas Mikolov's team at Google published *word2vec*: two simple "log-linear" models (CBOW and skip-gram). They learned a vector for every word from billions of words of raw text, in under a day [S1]. A companion paper the same year reported that directions in that vector space carry meaning: "King − Man + Woman" lands "very close to 'Queen'" [S2]. The caveats came later. The famous analogy works partly because the standard code **forbids returning any of the input words**. Remove that constraint and accuracy on Google's own analogy test collapses (0.74 → 0.21), "in most cases" because the method hands back one of the question's own words, as in "man is to king as woman is to king" [S7]. And the same geometry absorbed society's stereotypes: "man is to computer programmer as woman is to homemaker" [S6].

**Sentences became sequences (2014–2016).**
- Ilya Sutskever, Oriol Vinyals and Quoc Le (Google) showed that one deep LSTM could read an English sentence into a single vector and a second could write French out of it. An **ensemble of five** such reversed-input networks scored 34.8 BLEU against a phrase-based system's 33.3; the best single network scored 30.6 [S8].
- Dzmitry Bahdanau, Kyunghyun Cho and Yoshua Bengio (Montréal) argued that the single fixed-length vector was "a bottleneck". They let the decoder "(soft-)search" back over the source sentence at every step [S10]. This was the first widely adopted **attention** mechanism, the seed of the transformer.
- In September 2016, Google put these ideas into production as **GNMT**: an 8-layer encoder, an 8-layer decoder, attention, "wordpieces" and TPUs. In human side-by-side ratings it cut translation errors by about 60% against the phrase-based system [S11][S12]. The NYT Magazine reported that the neural system's overnight jump roughly equalled all the gains the old system had made over its lifetime [S13].

**Machines that imagine, and machines that play (2013–2015).**
- In June 2014, Ian Goodfellow and seven co-authors in Montréal proposed **generative adversarial networks**: a generator learns to forge data while a discriminator learns to catch forgeries [S14]. As MIT Technology Review's 2018 profile tells it (the reporter's narration, with no direct quote from Goodfellow), he coded the first one the same night the idea came to him in a Montréal bar [S15].
- In London, a small start-up called **DeepMind** (founded 2010 by Demis Hassabis, Shane Legg and Mustafa Suleyman) trained one convolutional network to play Atari games from raw pixels and the score [S17]. In 2015 it published a version in *Nature* that played 49 games with one architecture. It beat all earlier reinforcement-learning methods on 43 of them and reached more than 75% of a professional human tester's score on 29 [S18].
- Google bought DeepMind in January 2014. The Guardian reported £400m, about $650m; other reports said about $400m (the Guardian's own photo caption says "around $400m"). No figure was ever officially confirmed [S19][S20]. **[CONTESTED figure]**

**Go (2015–2017).** Go had been called the last great board game that machines could not crack. In May 2014 the leading Go programmer, Rémi Coulom, guessed a machine would beat a pro without handicap in "maybe ten years" [S22].
- In October 2015, DeepMind's **AlphaGo** beat the European champion Fan Hui 5–0 behind closed doors [S23].
- In March 2016, at the Four Seasons hotel in Seoul, it beat Lee Sedol 4–1 [S27][S28].
- In game 2, **move 37** was a stone that AlphaGo's own policy network gave about a one-in-ten-thousand chance of a human playing. Fan Hui called it "not a human move… So beautiful" [S26][S27].
- In game 4, Lee's **move 78** (dubbed "God's Touch") won humanity's only game [S27][S29].
- In October 2017, **AlphaGo Zero**, trained with no human games at all, beat the Lee Sedol version 100–0 after 72 hours of self-play [S30]. (In that match it *played* on one machine with 4 TPUs; its training ran on Google Cloud with 64 GPU workers and 19 CPU parameter servers [S30].)

**The new labs.** The talent war produced new institutions:
- Facebook AI Research, announced by Yann LeCun on 9 December 2013 at NIPS in Lake Tahoe [S35][S36].
- Baidu's deep-learning lab in Silicon Valley, led from May 2014 by Andrew Ng [S37].
- OpenAI, announced 11 December 2015 as a non-profit. Its stated goal was "to advance digital intelligence in the way that is most likely to benefit humanity as a whole, unconstrained by a need to generate financial return." Sam Altman and Elon Musk were co-chairs, Ilya Sutskever research director and Greg Brockman CTO, and the funders "committed $1 billion" [S32].

**The dissent.**
- In December 2013, Christian Szegedy and colleagues showed that an imperceptible, deliberately chosen perturbation can make a deep network misclassify an image [S38]. A year later Goodfellow's panda became a "gibbon" with 99.3% confidence [S39].
- In January 2018, Gary Marcus published "Deep Learning: A Critical Appraisal", listing ten concerns. Among them: deep learning is data-hungry and shallow, struggles with hierarchical structure, is opaque, and cannot tell causation from correlation. He argued it "must be supplemented by other techniques" [S40].
- In February 2018, Joy Buolamwini and Timnit Gebru's *Gender Shades* showed commercial gender classifiers erring on up to 34.7% of darker-skinned women but at most 0.8% of lighter-skinned men [S41].

**The coronation.** On 27 March 2019, ACM named Bengio, Hinton and LeCun recipients of the **2018 A.M. Turing Award**, "for conceptual and engineering breakthroughs that have made deep neural networks a critical component of computing". The press release was headlined "Fathers of the Deep Learning Revolution". It noted that their efforts "were initially met with skepticism" and that "their methodology is now the dominant paradigm in the field" [S43].

---

## 2. Timeline

| Date | Event | Tag | Sources |
|---|---|---|---|
| 23 Sep 2010 | Company no. 07386350 incorporated in London under the placeholder name **"Friars 2022 Limited"**; renamed DeepMind Technologies Limited on 15 Nov 2010 (Wikipedia gives this as the "official launch"). Founders: Demis Hassabis, Shane Legg, Mustafa Suleyman | VERIFIED-PRIMARY (Companies House, fact-check) | [S49][S20] |
| Dec 2012 | Hinton's three-person company DNNresearch is auctioned at Harrah's, Lake Tahoe, during NIPS. The bidders were Baidu, Google, Microsoft and DeepMind. Bidding was paused at $44m and Hinton chose Google | VERIFIED-SECONDARY | [S21] |
| 16 Jan 2013 | Mikolov, Chen, Corrado & Dean post "Efficient Estimation of Word Representations in Vector Space" (word2vec, arXiv 1301.3781). Presented at the ICLR 2013 workshop | VERIFIED-PRIMARY | [S1] |
| 2013 (NAACL, June) | Mikolov, Yih & Zweig, "Linguistic Regularities in Continuous Space Word Representations": "King − Man + Woman" ≈ "Queen" | VERIFIED-PRIMARY | [S2] |
| 2013 | Baidu opens a deep-learning research outpost in Cupertino, California | VERIFIED-SECONDARY (Wired: "Last year") | [S37] |
| 14 Aug 2013 | Google open-sources the word2vec toolkit ("Learning the meaning behind words") | VERIFIED-PRIMARY | [S4] |
| 16 Oct 2013 | Mikolov, Sutskever, Chen, Corrado & Dean post "Distributed Representations of Words and Phrases and their Compositionality" (NIPS 2013). It adds negative sampling and subsampling and won the NeurIPS 2023 Test of Time Award | VERIFIED-PRIMARY | [S3][S5] |
| 9 Dec 2013 | LeCun announces on Facebook that he will direct Facebook's new AI lab, with sites in Menlo Park, London and New York. Zuckerberg announces it at the NIPS Deep Learning Workshop, Lake Tahoe | VERIFIED-PRIMARY + SECONDARY | [S36][S35] |
| 19 Dec 2013 | Mnih et al. (DeepMind) post "Playing Atari with Deep Reinforcement Learning": 7 games; beats prior methods on 6 and a human expert on 3 | VERIFIED-PRIMARY | [S17] |
| 21 Dec 2013 | Szegedy et al. post "Intriguing properties of neural networks", the first adversarial examples | VERIFIED-PRIMARY | [S38] |
| 26–27 Jan 2014 | Google confirms acquisition of DeepMind (first reported by Re/code and The Information on 26 Jan; Guardian 27 Jan). Guardian: "£400m ($650m)", though its own photo caption says "around $400m"; Wikipedia summarises reports as $400m–$650m. An ethics board was reportedly part of the deal | VERIFIED-SECONDARY; price CONTESTED | [S19][S20] |
| 12 May 2014 | Wired, "The Mystery of Go": Coulom guesses "maybe ten years" until a machine wins without handicap | VERIFIED-SECONDARY | [S22] |
| 16 May 2014 | Baidu announces that Andrew Ng will lead its AI research across the Sunnyvale and Beijing labs | VERIFIED-SECONDARY | [S37] |
| 3 Jun 2014 | Cho et al. post the RNN Encoder–Decoder paper (introducing the GRU) | VERIFIED-PRIMARY (arXiv metadata) | [S9] |
| 10 Jun 2014 | Goodfellow et al. post "Generative Adversarial Nets" (NIPS 2014) | VERIFIED-PRIMARY | [S14] |
| 1 Sep 2014 | Bahdanau, Cho & Bengio post "Neural Machine Translation by Jointly Learning to Align and Translate" (oral at ICLR 2015) | VERIFIED-PRIMARY | [S10] |
| 10 Sep 2014 | Sutskever, Vinyals & Le post "Sequence to Sequence Learning with Neural Networks" (NIPS 2014) | VERIFIED-PRIMARY | [S8] |
| 24 Oct 2014 (reported 27 Oct) | Musk at MIT's AeroAstro Centennial Symposium: "With artificial intelligence we are summoning the demon" | VERIFIED-SECONDARY (quote and venue); the 24 Oct day is KNOWLEDGE, the Guardian gives no day | [S34] |
| 20 Dec 2014 | Goodfellow, Shlens & Szegedy post "Explaining and Harnessing Adversarial Examples" (FGSM, panda→gibbon) | VERIFIED-PRIMARY | [S39] |
| 25–26 Feb 2015 | Mnih et al., "Human-level control through deep reinforcement learning", *Nature* 518:529–533 (online 25 Feb; issue 26 Feb) | VERIFIED-PRIMARY | [S18] |
| 5–9 Oct 2015 | AlphaGo beats Fan Hui 5–0 in formal games (3–2 in informal fast games) at DeepMind, London | VERIFIED-PRIMARY | [S23] |
| 11 Dec 2015 | "Introducing OpenAI" (Brockman, Sutskever and the OpenAI team), published during NIPS in Montréal | VERIFIED-PRIMARY | [S32][S33] |
| 27–28 Jan 2016 | AlphaGo paper in *Nature* (online 27 Jan) | VERIFIED-PRIMARY | [S23] |
| 9 Mar 2016 | Game 1 vs Lee Sedol, Four Seasons Seoul. AlphaGo wins | VERIFIED-SECONDARY | [S24] |
| 10 Mar 2016 | Game 2: **move 37**. AlphaGo wins | VERIFIED-SECONDARY | [S25][S26] |
| 12 Mar 2016 | Game 3: AlphaGo wins and takes the match | VERIFIED-SECONDARY | [S25][S27] |
| 13 Mar 2016 | Game 4: Lee's **move 78**. Lee wins | VERIFIED-SECONDARY | [S29][S27] |
| 15 Mar 2016 | Game 5: AlphaGo wins; final score 4–1 | VERIFIED-SECONDARY (fact-check: game dates 9, 10, 12, 13, 15 March per Wikipedia "AlphaGo versus Lee Sedol"; the 4–1 score is VERIFIED [S27][S28]) | [S28][S45] |
| 21 Jul 2016 | Bolukbasi et al., "Man is to Computer Programmer as Woman is to Homemaker?" | VERIFIED-PRIMARY | [S6] |
| 26–27 Sep 2016 | GNMT paper (arXiv 26 Sep) and Google blog (27 Sep). Chinese→English moves 100% to GNMT, about 18 million translations a day | VERIFIED-PRIMARY | [S11][S12] |
| Nov 2016 | Rollout of neural Translate to eight language pairs with English, announced by Pichai in London. Rekimoto's viral blog post | VERIFIED-SECONDARY | [S13] |
| 19 Nov 2016 | Buolamwini's TEDxBeaconStreet talk, "the coded gaze" (white-mask demo) | VERIFIED-PRIMARY | [S42] |
| 14 Dec 2016 | NYT Magazine, "The Great A.I. Awakening" (Gideon Lewis-Kraus) | VERIFIED-SECONDARY | [S13] |
| Jan 2017 | "AlphaGo Master" wins 60–0 in online games against top professionals | VERIFIED-PRIMARY (per AGZ paper) | [S30] |
| Jun 2017 | "Attention Is All You Need" posted (handoff to `transformer-deep-dive`) | KNOWLEDGE | — |
| 15 Sep 2017 | Hinton (Axios): "Science progresses one funeral at a time…" (quoted by Marcus) | VERIFIED-SECONDARY (via [S40]; Axios unreadable) | [S40] |
| 5 Oct 2017 | Marcus–LeCun debate at NYU's Center for Mind, Brain and Consciousness, "Does Artificial Intelligence Need More Innate Machinery?" | VERIFIED-PRIMARY (event page, fact-check) | [S47] |
| 19 Oct 2017 | AlphaGo Zero, *Nature*: beats AlphaGo Lee 100–0 after 72 hours; beats Master 89–11 after 40 days | VERIFIED-PRIMARY | [S30][S31] |
| 2 Jan 2018 | Marcus, "Deep Learning: A Critical Appraisal" (arXiv 1801.00631) | VERIFIED-PRIMARY | [S40] |
| Feb 2018 (FAT* 2018; PMLR 81) | Buolamwini & Gebru, "Gender Shades" | VERIFIED-PRIMARY | [S41] |
| 21 Feb 2018 | MIT Technology Review, "The GANfather" (the bar origin story) | VERIFIED-SECONDARY | [S15] |
| 27 Mar 2019 | ACM names Bengio, Hinton and LeCun for the 2018 Turing Award ($1m, funded by Google) | VERIFIED-PRIMARY | [S43] |
| 15 Jun 2019 | Turing Award banquet, San Francisco | VERIFIED-PRIMARY | [S43] |
| 19 Nov 2019 | Lee Sedol submits his retirement letter to the Korea Baduk Association. On 27 Nov he tells Yonhap: "there is an entity that cannot be defeated" | VERIFIED-SECONDARY | [S29] |
| Dec 2023 | NeurIPS Test of Time Award goes to the 2013 word2vec phrases paper ("cited over 40,000 times") | VERIFIED-PRIMARY | [S5] |

---

## 3. People

> **Depiction note.** These appearance notes are for respectful silhouette work. They come from widely published photographs and are **[KNOWLEDGE]** unless a source is given. Avoid caricature. Silhouettes should read through posture, hair outline, glasses and period clothing, never through exaggerated features.

**Tomas Mikolov** (b. 1982, Czech). Research scientist at Google (Mountain View) in 2013. His PhD was from Brno University of Technology, on recurrent neural network language models (the RNNLM test set URL in the word2vec paper points to fit.vutbr.cz [S1]). He moved to Facebook AI Research in 2014 [VERIFIED-SECONDARY, Wikipedia: joined Google Brain after his 2012 PhD; "In 2014, he moved to Facebook AI Research"].
- **Belief:** simple, fast models trained on far more data beat complex models on less data. The word2vec abstract stresses "much lower computational cost" and "less than a day" on 1.6 billion words [S1].
- **Appearance:** slim, close-cropped or receding hair, often unshaven, casual T-shirts and hoodies.

**Ilya Sutskever** (b. 1986, born in the Soviet Union, raised in Israel and Canada). Hinton's PhD student in Toronto and co-author of AlexNet. He joined Google via DNNresearch in 2013 [S21]. He was a co-author of the word2vec phrases paper [S3], first author of seq2seq [S8] and a co-author of the first adversarial-examples paper [S38]. He left Google to become OpenAI's research director in December 2015 [S32].
- **Belief:** large networks plus enough data will work: "provided they have enough training data" [S8].
- **Appearance:** slight build, shaved or very short hair with a receding hairline, intense gaze, plain dark T-shirts or sweaters.

**Oriol Vinyals** (Spanish, from Barcelona). Google Brain, later DeepMind. Second author of seq2seq [S8] [KNOWLEDGE for career].
- **Appearance:** dark hair, beard, casual.

**Quoc Le** (Vietnamese-born). Google Brain. Co-author of seq2seq [S8], co-author of the GNMT blog [S12] and co-author of the word2vec release blog [S4]. He worked on the 2012 "cat" paper (see `deep-learning-renaissance`).
- **Appearance:** slim, short black hair, glasses at times, casual shirts.

**Dzmitry Bahdanau** (Belarusian). A master's or PhD intern in Bengio's Montréal lab in 2014 and first author of the attention paper [S10]. His exact status in 2014 is [KNOWLEDGE].
- **Appearance:** young, slim, short light hair.

**Kyunghyun Cho** (Korean). Postdoc at Université de Montréal (2014), later NYU. He led the RNN Encoder–Decoder/GRU paper [S9] and was second author on attention [S10].
- **Appearance:** short black hair, glasses, often a hoodie.

**Yoshua Bengio** (b. 1964, Paris; based in Montréal). Professor at Université de Montréal. In 2019 he was "Scientific Director at Mila" [S43]. He was the senior author of the GAN and attention papers [S14][S10], an advisor to OpenAI at its founding [S32] and a 2018 Turing laureate.
- **Appearance:** medium build, curly greying dark hair, bushy eyebrows, often a dark sweater or open-collared shirt.

**Ian Goodfellow** (American). In 2014 he was a PhD student at Université de Montréal [S38 affiliation]. He was first author of the GAN paper [S14] and of FGSM [S39], and co-author of the original adversarial-examples paper [S38]. He later worked at Google Brain, OpenAI and Apple [KNOWLEDGE].
- **Appearance:** tall, slim, dark hair, usually beardless, casual. The 2018 MIT TR portrait shows him in a plain dark shirt [S15 photo credit only].

**Demis Hassabis** (b. 1976, London). A former child chess prodigy. At 17 he co-designed and was lead programmer on *Theme Park* at Bullfrog. He took a double first in computer science at Cambridge (1997) and founded Elixir Studios (1998). His PhD in cognitive neuroscience was from UCL (2009). [Fact-check: birth 27 Jul 1976, Theme Park at 17 (1994), Cambridge double first 1997, Elixir 1998, UCL PhD 2009 all VERIFIED-SECONDARY via Wikipedia "Demis Hassabis".] He co-founded DeepMind [S19] and was "very much the face of AlphaGo" in Seoul [S27].
- **Belief:** Go is "the most elegant game that humans have ever invented" and "the only game left above chess" [S24]. General learning systems (reinforcement learning plus deep learning, inspired by neuroscience) are the route to general AI [S18 framing].
- **Appearance:** small, slight build, short dark hair, boyish face, often a dark suit jacket over an open-collar shirt.

**Shane Legg** (New Zealander). Co-founder and chief scientist of DeepMind [S19][S20]. A machine-intelligence theorist who had done a PhD with Marcus Hutter [KNOWLEDGE].
- **Appearance:** tall, lean, short sandy hair, glasses.

**Mustafa Suleyman** (b. 1984, London). Co-founder of DeepMind, responsible for applied work and policy [S19][S20] [KNOWLEDGE for role].
- **Appearance:** short dark hair, neatly trimmed beard, open-necked shirts.

**David Silver** (British). Lead researcher on AlphaGo; first author of the AlphaGo and AlphaGo Zero papers [S23][S30][S27]. He had worked on computer Go during his PhD at the University of Alberta [KNOWLEDGE].
- **Appearance:** tall, slim, short dark hair, beard.

**Aja Huang** (Taiwanese). DeepMind engineer and strong amateur Go player. He sat opposite Lee Sedol and "physically placed the stones on the board in positions chosen by AlphaGo" [S24].
- **Appearance:** glasses, short dark hair. In Seoul he wore a dark suit, with a Union Jack on the AlphaGo side of the table [KNOWLEDGE for the flag].

**Lee Sedol** (b. 1983, South Korea). 9-dan professional and winner of 18 world titles [S28]. He was "ranked number five in the world" at the time of the match [S25]. Lee was 33, sported "a bowlish haircut and looks younger than his 33 years", and spent the match "leaning forward, cradling his chin in his hand" [S24]. He retired in November 2019 [S29].
- **Belief before the match:** "nothing less than adamant earlier in the week that he would defeat Google's artificially intelligent creation" [S25]. "As recently as two weeks ago, Lee said he was confident of a sweeping victory" [S24].
- **Appearance:** slight build, bowl-cut dark hair, dark suit and tie.

**Fan Hui** (Chinese-born, French resident). Professional 2-dan and European champion in 2013, 2014 and 2015 [S23]. He was ranked 633rd in the world when he lost to AlphaGo, and rose "into the 300s" after months of sparring with it [S25][S26].
- **Appearance:** round face, short hair, glasses.

**Rémi Coulom** (French). Creator of Crazy Stone and the Monte Carlo Tree Search pioneer of 2006 [S22]. Wired pictures him "in a blue turtleneck sweater… hunched over a battered Macbook laptop" [S22].

**Yann LeCun** (b. 1960, near Paris; NYU, New York). Director of Facebook AI Research from 9 December 2013. He kept a part-time NYU professorship and was "based at Facebook's Manhattan office, which is only a block from NYU's main campus" [S35][S36]. By 2019 he was "VP and Chief AI Scientist, Facebook" [S43]. He was a 2018 Turing laureate.
- **Appearance:** solid, medium build; short dark hair, later grey; rectangular glasses; often a dark blazer over a T-shirt.

**Andrew Ng** (b. 1976, London; raised in Hong Kong and Singapore). Stanford professor and co-founder of Google Brain. From May 2014 he was Baidu's chief scientist, running the Sunnyvale lab and a Beijing R&D centre [S37]; the "chief scientist" title is VERIFIED-SECONDARY (Wikipedia, citing Recode, 16 May 2014). He announced his resignation from Baidu in March 2017.
- **Appearance:** tall, slim, short black hair, often a blue button-down shirt.

**Geoffrey Hinton** (b. 1947, London; Toronto and Google). Joined Google part-time via DNNresearch (2013) [S21]. In 2019: "VP and Engineering Fellow of Google, Chief Scientific Adviser of The Vector Institute, and University Professor Emeritus at the University of Toronto" [S43]. He famously cannot sit because of a back injury: "I last sat down in 2005… and it was a mistake" [S21].
- **Belief, 2017:** deeply sceptical of his own methods' permanence: "The future depends on some graduate student who is deeply suspicious of everything I have said" [S40].
- **Appearance:** tall and lean, standing; thinning grey-white hair; cardigans or V-neck sweaters over collared shirts.

**Sam Altman** (b. 1985). President of Y Combinator; co-chair of OpenAI in 2015 [S32][S33].
- **Appearance:** slight build, short brown hair, casual sweaters.

**Elon Musk** (b. 1971). CEO of Tesla and SpaceX; co-chair of OpenAI in 2015 [S32]. He had warned that AI is probably "our biggest existential threat" (MIT, Oct 2014) [S34]. He left OpenAI's board in 2018 [KNOWLEDGE].
- **Appearance:** tall, broad-shouldered, short brown hair, dark suit or T-shirt.

**Greg Brockman**. "Formerly the CTO of Stripe"; OpenAI's CTO in 2015 [S32].
- **Appearance:** slim, short dark hair, glasses at times, hoodies.

**Other OpenAI founding members** named in the announcement: Trevor Blackwell, Vicki Cheung, Andrej Karpathy, Durk Kingma, John Schulman, Pamela Vagata and Wojciech Zaremba. The advisors were Pieter Abbeel, Yoshua Bengio, Alan Kay, Sergey Levine and Vishal Sikka [S32].

**Christian Szegedy** (Hungarian-born; Google). First author of "Intriguing properties of neural networks" [S38] and of GoogLeNet. His co-authors were Zaremba, Sutskever, Bruna, Erhan, Goodfellow and Fergus [S38].

**Gary Marcus** (b. 1970; NYU professor of psychology and neural science). Cognitive scientist and founder of the start-up Geometric Intelligence (acquired by Uber in 2016) [KNOWLEDGE]. Author of the 2018 appraisal [S40].
- **Belief:** deep learning is "one tool among many, a power screwdriver in a world in which we also need hammers, wrenches, and pliers" [S40].
- **Appearance:** medium build, curly dark hair, often a jacket over an open collar.

**Joy Buolamwini** (MIT Media Lab, Cambridge MA). A graduate student who calls herself "a poet of code" [S42]. Ghanaian-American; studied at Georgia Tech and was a Rhodes Scholar [Georgia Tech per S42; other details KNOWLEDGE].
- **Appearance:** slim, often natural hair or locs, and the iconic **white mask** held to a webcam [S42].

**Timnit Gebru** (Ethiopian-born; Microsoft Research NYC, 641 Avenue of the Americas, in 2018) [S41]. Her PhD was at Stanford with Fei-Fei Li. She co-founded Black in AI [KNOWLEDGE].
- **Appearance:** medium height, long dark curly hair.

**Tolga Bolukbasi, Kai-Wei Chang, James Zou, Venkatesh Saligrama and Adam Kalai** were the authors of the 2016 debiasing paper [S6]. **Malvina Nissim, Rik van Noord and Rob van der Goot** (Groningen) wrote the 2019 analogy critique [S7].

**Jun Rekimoto** (University of Tokyo, HCI professor). Noticed overnight that Google Translate had "suddenly and almost immeasurably improved" in November 2016 [S13].

---

## 4. The belief of the age

**What the field believed (c. 2013–2017).** Most researchers held that the AlexNet recipe was general. Hand-engineered pipelines would be replaced by networks trained end to end on raw inputs, if you had enough labelled data and compute.
- **Vision (2012)** led the way; speech had already fallen (see `deep-learning-renaissance`).
- **Words (2013):** meaning could be learned from co-occurrence statistics alone [S1][S4].
- **Translation (2014–2016):** decades of phrase tables, alignment models and language models could be replaced by one network "that makes minimal assumptions on the sequence structure" [S8]. The GNMT paper's subtitle was "Bridging the Gap between Human and Machine Translation" [S11].
- **Control (2013–2015):** reinforcement learning no longer needed handcrafted features. DQN learned "directly from high-dimensional sensory inputs" [S18].
- **Go (2016–2017):** "intuition" in a game long held to require it could be learned, first from human games and then from none [S23][S30].

The OpenAI founding post states the belief succinctly. In deep learning, "rather than hand-code a new algorithm for each problem, you design architectures that can twist themselves into a wide range of algorithms based on the data you feed them" [S32]. Its forecast that "in the extreme case they will reach human performance on virtually every intellectual task" shows how far the optimism had travelled by 2015 [S32].

**Who held it.** The Toronto, Montréal and NYU groups and their students (now at Google Brain, DeepMind, FAIR, Baidu and OpenAI). Industrial leadership acted on it with money: the DNNresearch auction [S21], DeepMind's acquisition [S19], FAIR [S35], Baidu's lab [S37] and Google's "A.I. first" strategy [S13].

**A second, parallel belief: that this could be dangerous.** Musk said in 2014 that AI was probably "our biggest existential threat" [S34]. OpenAI was founded partly on the worry that "it's equally hard to imagine how much it could damage society if built or used incorrectly" [S32]. Altman framed the remedy as openness: "many, many AIs, will work to stop the occasional bad actors" [S33]. This optimism and fear in one package became the founding tension of the frontier labs; see `scaling-hypothesis-alignment`.

**Who dissented, and on what grounds.**
1. **Robustness (from Dec 2013).** Szegedy et al. showed deep nets "learn input-output mappings that are fairly discontinuous". A "hardly perceptible perturbation" flips the label, and the same perturbation fools other networks too [S38]. Goodfellow et al. (2014) blamed not exotic non-linearity but networks being "too linear" in high dimensions [S39]. This was dissent from inside the movement: Sutskever and Goodfellow were co-authors.
2. **Generalisation and reasoning (Marcus, long-running; formalised Jan 2018).** He listed ten concerns [S40]. He wrote that deep learning "may well be approaching a wall, much as I anticipated earlier, at beginning of the resurgence (Marcus, 2012)" [S40]: that is, he had warned of limits in 2012, at the start of the revival. (Corrected in fact-check: "the beginning of the resurgence" is Marcus's description of *when* he warned, not his description of deep learning.) He quoted François Chollet (Keras author, Google): "we've entered diminishing returns territory in 2016-2017" (18 Dec 2017) [S40].
3. **Social harm (2016–2018).** Bolukbasi et al. showed embeddings "exhibit female/male gender stereotypes to a disturbing extent" [S6]. Buolamwini & Gebru measured accuracy gaps by skin type and gender in deployed commercial APIs [S41].
4. **Even Hinton.** In September 2017 he said that "the future depends on some graduate student who is deeply suspicious of everything I have said" [S40].
5. **On Go specifically**, the "decade away" consensus (Coulom 2014 [S22]; the AlphaGo paper's "previously believed to be at least a decade away" [S23]) was a belief held by the computer-Go community. Lee Sedol's own confidence before the match reflected the Go community's view [S24][S25].

**How long it held, and what changed it.** The core belief was not refuted. It was ratified: AlphaGo in 2016, GNMT in 2016 and the Turing Award in 2019 [S43]. What changed was its form.
- In 2017 the transformer replaced the recurrent sequence models of this era (handoff to `transformer-deep-dive`).
- The task-specific "one network per problem" picture gave way to large pretrained models (2018 onward).
- The dissents did not go away. Adversarial robustness, bias audits and Marcus-style critiques of reasoning continued into the LLM era (see `reasoning-agents-current-understanding`).
- The Go belief ("a decade away") ended abruptly: in October 2015 (privately) and on 9 March 2016 (publicly) [S23][S24].

---

## 5. Experiments and results

### 5.1 word2vec (2013) [S1][S2][S3][S4]
- **Architecture:** two "New Log-linear Models", CBOW and skip-gram. They deliberately removed the "non-linear hidden layer", which the authors identified as where "most of the complexity is caused" [S1]. Each word gets a vector; skip-gram learns to predict a word's neighbours from the word.
- **Data:** a Google News corpus of "about 6B tokens", with the vocabulary restricted to "1 million most frequent words" [S1]. The headline claim: "it takes less than a day to learn high quality word vectors from a 1.6 billion words data set" [S1]. The NIPS paper: "an optimized single-machine implementation can train on more than 100 billion words in one day" [S3]. Trained partly on Google's DistBelief framework [S1].
- **Test:** an analogy test set (e.g. "biggest" − "big" + "small" → "smallest"; "France is to Paris as Germany is to Berlin") [S1]. Skip-gram with 300 dimensions on 783M words scored 50.0% semantic, 55.9% syntactic and 53.3% total [S1].
- **NAACL result (RNN vectors):** "'King − Man + Woman' results in a vector very close to 'Queen'". The vectors "correctly answer almost 40% of the questions" on syntactic analogies [S2].
- **Phrases paper:** "vec('Madrid') − vec('Spain') + vec('France') is closer to vec('Paris') than to any other word vector" [S3]. It introduced negative sampling and subsampling of frequent words [S3].
- **Release:** open-source toolkit, 14 Aug 2013, blog by Mikolov, Sutskever and Le. The blog's chart showed countries and capitals arranged "in parallel" "with no human supervision" [S4].
- **Caveat 1 (the constraint):** "In the default implementation of word2vec… the input terms of the analogy query are not allowed to be returned" [S7]. When they are allowed, accuracy on Google's analogy set falls from 0.74 to 0.21 (3COSADD, micro). "In most cases, this is because the second term is returned as answer (man is to king as woman is to king…)" [S7]. *Fact-check note:* the "king" example is Nissim et al.'s illustration of the aggregate pattern; they do not report the output of the specific king/queen query, so say "the method usually hands back one of the question's own words", not "the king query usually returns king".
- **Caveat 2 (bias):** in GoogleNews vectors, man : computer_programmer :: woman : X returns "homemaker" under the default constrained method. Unconstrained, it returns "computer_programmer" [S7 Table 2][S6].
- **Visual for the art department:** a star-field of words. A "gender" arrow is drawn from *man* to *woman*, then the same arrow is copied onto *king*. It lands near *queen*. **But** the rules also forbid the answer from being any of the question's own words; without that rule the method most often lands back on an input word (e.g. *king*) [S7].

### 5.2 Sequence to sequence (2014) [S8]
- **Task:** WMT'14 English→French. Training subset: "12M sentences consisting of 348M French words and 304M English words" [S8].
- **Model:** a deep LSTM "with 4 layers, with 1000 cells at each layer and 1000 dimensional word embeddings". Input vocabulary 160,000 and output 80,000. Each model has 384M parameters: the paper's headline is "a BLEU score of 34.81 by directly extracting translations from an ensemble of 5 deep LSTMs (with 384M parameters and 8,000 dimensional state each)" [S8]. An encoder LSTM reads the sentence into a fixed vector, and a decoder LSTM emits the translation.
- **The trick:** "reversing the order of the words in all source sentences (but not target sentences) improved the LSTM's performance markedly" [S8]. "We were surprised by the extent of the improvement" [S8].
- **Machine:** "an 8-GPU machine". Each of the 4 LSTM layers ran on its own GPU and the other 4 GPUs parallelised the softmax, reaching "6,300 (both English and French) words per second". "Training took about a ten days" (sic) [S8].
- **Numbers (corrected in fact-check):** BLEU 34.81 from an **ensemble of 5 reversed LSTMs** (beam 12), versus 33.30 for the phrase-based SMT baseline. Single networks scored lower: 26.17 (forward input) and 30.59 (reversed input), both beam 12 (Table 1). Rescoring the SMT system's 1000-best list gave 36.5, "close to the previous best published result" (37.0) [S8]. The "about ten days" of training is per model, so the ensemble cost several such runs.
- **Art note:** a single tower PC humming with eight GPUs. A sentence enters right-to-left, is squeezed into one glowing vector, and unspools as French.

### 5.3 Attention (2014) [S10][S9]
- **Claim:** "we conjecture that the use of a fixed-length vector is a bottleneck". The model can "automatically (soft-)search for parts of a source sentence that are relevant to predicting a target word" [S10]. Title: "Neural Machine Translation by Jointly Learning to Align and Translate".
- **Numbers (careful):**

  | System | BLEU, all test sentences | BLEU, sentences with no unknown words |
  |---|---|---|
  | RNNsearch-50 | 26.75 | 34.16 |
  | RNNsearch-50★ (trained longer) | 28.45 | 36.15 |
  | Moses phrase-based | 33.30 | 35.63 |

  So attention **matched or beat Moses only on sentences without unknown words**. Moses also used a separate monolingual corpus of 418M words [S10].
- **Compute:** the text says each model trained for "approximately 5 days", but Table 2 lists RNNsearch-50★ (the "trained longer" model behind the 28.45/36.15 scores) at 252 hours, about 10.5 days, on an NVIDIA Quadro K-6000; the others took 108–113 hours on Quadro K-6000 or TITAN BLACK cards [S10].
- **Visual:** the paper's alignment heat-maps, a grid of English words against French words with bright cells along a mostly diagonal path. They bend where French reorders adjectives: Fig. 3(a) shows "[European Economic Area]" translated as "[zone économique européenne]", with the model aligning "zone" to "Area" by "jumping over the two words" [VERIFIED-PRIMARY, S10, fact-check].
- **Context:** Cho et al. (June 2014) introduced the RNN Encoder–Decoder, with the gated recurrent unit, for phrase scoring [S9].

### 5.4 GNMT (2016) [S11][S12][S13]
- **Architecture:** "a deep LSTM network with 8 encoder and 8 decoder layers using residual connections as well as attention connections from the decoder network to the encoder". Low-precision inference and "wordpieces" for rare words. The paper's example: "_J et _makers _fe ud _over _seat _width…" [S11].
- **Hardware:** TensorFlow and Tensor Processing Units [S11][S12].
- **Result:** "Using a human side-by-side evaluation on a set of isolated simple sentences, it reduces translation errors by an average of 60% compared to Google's phrase-based production system" [S11]. The blog says "more than 55%-85% on several major language pairs" [S12]. The rating scale ran 0 ("completely nonsense translation") to 6 ("perfect translation") [S12].
- **Launch:** 27 Sep 2016, Chinese→English at 100%, "about 18 million translations per day" [S12]. The blog admits it "can still make significant errors… like dropping words and mistranslating proper names or rare terms" [S12].
- **NYT account:** "completed in only nine months". It made "overnight improvements roughly equal to the total gains the old one had accrued over its entire lifetime" [S13]. Jun Rekimoto's test translated Hemingway's "The Snows of Kilimanjaro" into Japanese and back to English [S13].

### 5.5 GANs (2014) [S14][S15]
- **Setup:** "a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G… This framework corresponds to a minimax two-player game" [S14].
- **Analogy, from the paper:** "a team of counterfeiters, trying to produce fake currency and use it without detection, while the discriminative model is analogous to the police" [S14].
- **2014 results** were small, blurry samples on MNIST, faces (TFD) and CIFAR-10 [KNOWLEDGE].
- **Origin story:** Les 3 Brasseurs, Montréal, "one night in 2014", celebrating "a fellow doctoral student who had just graduated". He went home, "where his girlfriend was already fast asleep", "coded into the early hours" and "It worked the first time" [S15]. These phrases are the MIT TR reporter's narration, not quotations of Goodfellow, and are not an independent record. Attribute as "as MIT Technology Review tells it".

### 5.6 DQN (2013 → 2015) [S17][S18]
- **Apparatus:** the Arcade Learning Environment, an emulated Atari 2600. Raw frames are "210 × 160 pixel images with a 128 color palette", at 60 Hz. They are converted to grey-scale and down-sampled (110×84, then cropped to 84×84) [S17]. Input: pixels and score only [S18]. Audio was disabled for both the agent and the human tester [S18].
- **2013:** "seven Atari 2600 games… outperforms all previous approaches on six of the games and surpasses a human expert on three of them" [S17].
- **2015 *Nature*:** 49 games, one architecture and one set of hyperparameters. It beat the best prior RL "on 43 of the games". It achieved "more than 75% of the human score on more than half of the games (29 games)" against "a professional human games tester" [S18].
- **Training:** "a total of 50 million frames (that is, around 38 days of game experience in total)" and "a replay memory of 1 million most recent frames" [S18].
- **The Breakout tunnel (verified):** "the agent learns the optimal strategy, which is to first dig a tunnel around the side of the wall allowing the ball to be sent around the back to destroy a large number of blocks" [S18].
- **The failure (verified):** "games demanding more temporally extended planning strategies still constitute a major challenge… (for example, Montezuma's Revenge)" [S18].

### 5.7 AlphaGo (2015–2016) [S23][S24]–[S28]
- **Why Go is hard:** branching factor b ≈ 250 and depth d ≈ 150, versus b ≈ 35 and d ≈ 80 for chess [S23].
- **Method:** a "policy network" (move selection) and a "value network" (position evaluation). They were trained first by supervised learning on "30 million positions from the KGS Go Server", then by reinforcement learning from self-play, and combined with Monte Carlo tree search [S23].
- **Hardware:** the distributed version used "40 search threads, 1,202 CPUs and 176 GPUs" [S23].
- **Fan Hui match:** 5–9 Oct 2015, arbitrated by "an impartial referee". 7.5 komi, Chinese rules, 1 h main time plus three 30-s byoyomi periods. AlphaGo won the formal games **5–0** and the informal games **3–2** [S23].
- **Lee Sedol match** (Four Seasons Hotel, Seoul, 9–15 March 2016): best-of-five, a $1 million prize [S27], won 4–1 [S27][S28].
  - The match was "watched by over 200 million people worldwide" (DeepMind's figure) [S28].
  - AlphaGo was later awarded an honorary 9-dan professional ranking, "the first time a computer Go player had received the highest possible certification" [S28].
  - The Lee version ran on 48 TPUs [S30].
  - Hassabis before game 2: "One game is not enough data to learn from—for a machine—and training takes an awful lot of time." Retraining takes "a good four to six weeks", so the machine could not adapt mid-match [S25].
- **Move 37, game 2, 10 March 2016:**
  - Black stone on the right-hand side, "approaching the end of its first hour" [S26]. In AlphaGo's own count it was its **19th** stone; Wired's live report called it "its 19th move" [S25].
  - Commentators: "That's a very surprising move" / "I thought it was a mistake" [S26]. "That's a very strange move" / "I thought it was a mistake" [S27]. The two Wired pieces give the first line differently, so do not quote it.
  - Lee left the room, then took "nearly fifteen minutes" to respond [S27].
  - Silver: AlphaGo "had calculated that there was a one-in-ten-thousand chance that a human would make that move" [S27]. DeepMind: "a 1 in 10,000 chance of being used" [S28].
- **Move 78, game 4, 13 March 2016:**
  - A "wedge" in the centre after Lee thought "for a good 30 minutes". AlphaGo's reply at 79 was "disastrous" [S27][S29].
  - Hassabis said AlphaGo also put Lee's move at one in ten thousand [S27].
  - In 2019, according to Yonhap's paraphrase (not a direct quote), "Lee attributed his win to a bug in the AlphaGo program" [S29].

### 5.8 AlphaGo Zero (2017) [S30][S31]
- No human games. "Without human data, guidance or domain knowledge beyond game rules" [S30]. One network (policy and value combined), a residual network, no rollouts [S31].
- After **36 hours** it outperformed AlphaGo Lee. After **72 hours** it beat AlphaGo Lee **100–0** "under the 2 hour time controls and match conditions as were used in the man-machine match in Seoul" [S30].
- Hardware (corrected in fact-check): **in the evaluation match** AlphaGo Zero "used a single machine with 4 Tensor Processing Units (TPUs)", versus 48 TPUs for AlphaGo Lee [S30]. That is playing (inference) hardware. **Training** was not on one machine: "Each neural network fθi is optimised on the Google Cloud using TensorFlow, with 64 GPU workers and 19 CPU parameter servers" (Methods), with self-play games generated separately [S30]. Do not say AlphaGo Zero "trained on one machine".
- 4.9 million self-play games in the 3-day run. A 40-day run produced 29 million games and beat AlphaGo Master **89–11** [S30].
- It rediscovered human *joseki* (corner sequences), then abandoned some for new variations [S30].

### 5.9 Adversarial examples (2013–2014) [S38][S39]
- **Szegedy et al.:** "We can cause the network to misclassify an image by applying a certain hardly perceptible perturbation… the same perturbation can cause a different network, that was trained on a different subset of the dataset, to misclassify the same input" [S38]. Their figure shows varied images all "predicted to be an 'ostrich, Struthio camelus'" [S38]. They spoke of "intrinsic blind spots" [S38].
- **Goodfellow, Shlens & Szegedy:**
  - GoogLeNet on ImageNet: "panda" at 57.7% confidence, plus 0.007 × sign(gradient) (which by itself is classed "nematode" at 8.2%), gives "gibbon" at 99.3% confidence [S39].
  - ε = 0.007 equals "the smallest bit of an 8 bit image encoding" [S39].
  - The explanation was linearity: "Linear behavior in high-dimensional spaces is sufficient to cause adversarial examples" [S39, verbatim from the abstract; fact-check corrected the earlier "paraphrase" label]. Section 4: "We hypothesize that neural networks are too linear to resist linear adversarial perturbation" [S39].
  - On MNIST, a shallow softmax classifier hit "an error rate of 99.9% with an average confidence of 79.3%" [S39].

### 5.10 Gender Shades (2018) [S41][S42]
- **Dataset:** the Pilot Parliaments Benchmark, **1,270** parliamentarians from three African countries (Rwanda, Senegal, South Africa) and three European ones (Iceland, Finland, Sweden), labelled by Fitzpatrick skin type [S41].
- **Benchmarks audited:** IJB-A was 79.6% lighter-skinned and Adience 86.2% [S41].
- **Systems:** Microsoft, Face++ and IBM gender classifiers.
- **Error on darker-skinned females:** Microsoft 20.8%, Face++ 34.5%, IBM 34.7%.
- **Error on lighter-skinned males:** Microsoft 0.0%, Face++ 0.8%, IBM 0.3% [S41 tables].
- **Origin:** Buolamwini found her face-detection project "really hard to test… unless I wore a white mask" [S42].

### 5.11 Turing Award 2018 (announced 27 March 2019) [S43]
- **Citation:** "for conceptual and engineering breakthroughs that have made deep neural networks a critical component of computing".
- **Prize:** "a $1 million prize, with financial support provided by Google, Inc."
- **Ceremony:** the banquet was held Saturday 15 June 2019 in San Francisco.

---

## 6. Verified quotes

All quotes below were read in the source cited, during this pass. Use them exactly.

1. **Mikolov, Yih & Zweig (NAACL 2013), abstract:** "For example, the male/female relationship is automatically learned, and with the induced vector representations, "King - Man + Woman" results in a vector very close to "Queen."" [S2]. *Context:* RNN-LM vectors, not yet the word2vec toolkit.
2. **Mikolov et al. (2013a), abstract:** "it takes less than a day to learn high quality word vectors from a 1.6 billion words data set" [S1].
3. **Google Open Source Blog (14 Aug 2013; Mikolov, Sutskever, Le):** "we're publishing an open source toolkit called word2vec that aims to learn the meaning behind words." Also: "The most interesting part is that we didn't provide any supervised information before or during training." [S4]
4. **Nissim, van Noord & van der Goot (2019/2020):** "In the default implementation of word2vec (Mikolov et al. 2013), gensim (Řehůřek and Sojka 2010) as well as the code from Bolukbasi et al. (2016), the input terms of the analogy query are not allowed to be returned." [S7]
5. **Bolukbasi et al. (2016), abstract:** "We show that even word embeddings trained on Google News articles exhibit female/male gender stereotypes to a disturbing extent." [S6]
6. **Sutskever, Vinyals & Le (2014), conclusion:** "We were surprised by the extent of the improvement obtained by reversing the words in the source sentences." [S8]
7. **Sutskever, Vinyals & Le (2014), conclusion:** "The success of our simple LSTM-based approach on MT suggests that it should do well on many other sequence learning problems, provided they have enough training data." [S8]
8. **Bahdanau, Cho & Bengio (2014), abstract:** "In this paper, we conjecture that the use of a fixed-length vector is a bottleneck in improving the performance of this basic encoder–decoder architecture, and propose to extend this by allowing a model to automatically (soft-)search for parts of a source sentence that are relevant to predicting a target word, without having to form these parts as a hard segment explicitly." [S10] (verified in full against the arXiv PDF text)
9. **Goodfellow et al. (2014):** "The generative model can be thought of as analogous to a team of counterfeiters, trying to produce fake currency and use it without detection, while the discriminative model is analogous to the police, trying to detect the counterfeit currency." [S14] (arXiv version)
10. **Mnih et al. (2015), *Nature*:** "the agent learns the optimal strategy, which is to first dig a tunnel around the side of the wall allowing the ball to be sent around the back to destroy a large number of blocks" [S18].
11. **Rémi Coulom to Wired (May 2014), on when a machine will beat a pro without handicap:** "I think maybe ten years," he says. "But I do not like to make predictions." [S22]
12. **Silver et al. (2016), *Nature*:** "This is the first time that a computer Go program has defeated a human professional player, without handicap, in the full game of Go—a feat that was previously believed to be at least a decade away" [S23]. This is the body-text wording; the abstract's wording differs slightly ("a feat previously thought to be at least a decade away").
13. **Demis Hassabis (Guardian, 9 Mar 2016):** "There are more possible Go positions than there are atoms in the universe." Also called Go "the only game left above chess" and "the most elegant game that humans have ever invented" [S24].
14. **Lee Sedol after game 1 (via interpreter):** "I didn't know AlphaGo would play such a perfect game" (Guardian [S24]). Wired renders it: "I didn't think that AlphaGo would play the game in such a perfect manner" [S25]. *These are two interpreter renderings; pick one and cite it.*
15. **Fan Hui on move 37 (Wired, 11 Mar 2016):** "It's not a human move. I've never seen a human play this move," he says. "So beautiful." [S26]
16. **Lee Sedol after game 2 (via interpreter, Wired):** "Yesterday, I was surprised… But today I am speechless. If you look at the way the game was played, I admit, it was a very clear loss on my part. From the very beginning of the game, there was not a moment in time when I felt that I was leading." [S27]
17. **Lee Sedol after game 3 (via interpreter, Wired):** "I don't know what to say today, but I think I will have to express my apologies first." [S27]
18. **Michael Redmond on move 78 (Wired):** "It took me by surprise. I'm sure that it would take most opponents by surprise. I think it took AlphaGo by surprise." [S27]
19. **Lee Sedol (as published by DeepMind, translated):** "I thought AlphaGo was based on probability calculation and that it was merely a machine. But when I saw this move, I changed my mind. Surely, AlphaGo is creative." [S28]. *Caution:* DeepMind's own page and a translation, with the date and venue of the original remark not given. Attribute as "as quoted by DeepMind".
20. **Lee Sedol to Yonhap (25 Nov 2019 interview, published 27 Nov):** "With the debut of AI in Go games, I've realized that I'm not at the top even if I become the number one through frantic efforts… Even if I become the number one, there is an entity that cannot be defeated." [S29]. The ellipsis joins two sentences that Yonhap reports separately ("said Lee." / "he said…").
21. **OpenAI (11 Dec 2015):** "OpenAI is a non-profit artificial intelligence research company. Our goal is to advance digital intelligence in the way that is most likely to benefit humanity as a whole, unconstrained by a need to generate financial return." [S32]
22. **OpenAI (11 Dec 2015):** "It's hard to fathom how much human-level AI could benefit society, and it's equally hard to imagine how much it could damage society if built or used incorrectly." [S32]
23. **OpenAI (11 Dec 2015):** "In total, these funders have committed $1 billion, although we expect to only spend a tiny fraction of this in the next few years." [S32]
24. **Elon Musk at MIT (Oct 2014, Guardian):** "With artificial intelligence we are summoning the demon. In all those stories where there's the guy with the pentagram and the holy water, it's like – yeah, he's sure he can control the demon. Doesn't work out." [S34]
25. **Sam Altman to Steven Levy (11 Dec 2015):** "we think its [sic] far more likely that many, many AIs, will work to stop the occasional bad actors than the idea that there is a single AI a billion times more powerful than anything else." [S33]
26. **Yann LeCun, Facebook post (9 Dec 2013):** "Big news today! Facebook has created a new research laboratory with the ambitious, long-term goal of bringing about major advances in Artificial Intelligence." [S36]
27. **Szegedy et al. (2013), abstract:** "We can cause the network to misclassify an image by applying a certain hardly perceptible perturbation, which is found by maximizing the network's prediction error." [S38]
28. **Gary Marcus (2018), abstract:** "I present ten concerns for deep learning, and suggest that deep learning must be supplemented by other techniques if we are to reach artificial general intelligence." [S40]
29. **Gary Marcus (2018), conclusion:** "Despite all of the problems I have sketched, I don't think that we need to abandon deep learning. Rather, we need to reconceptualize it: not as a universal solvent, but simply as one tool among many, a power screwdriver in a world in which we also need hammers, wrenches, and pliers…" [S40]
30. **Geoffrey Hinton (15 Sep 2017, as quoted in Marcus 2018's epigraph):** "'Science progresses one funeral at a time.' The future depends on some graduate student who is deeply suspicious of everything I have said." [S40]. The original was Axios (Steve LeVine); the Axios page was not readable in this pass, so cite it as quoted by Marcus.
31. **François Chollet (18 Dec 2017, quoted in Marcus 2018):** "For most problems where deep learning has enabled transformationally better solutions (vision, speech), we've entered diminishing returns territory in 2016-2017." [S40]. The original is a tweet, so cite it as quoted by Marcus.
32. **Buolamwini & Gebru (2018), abstract:** "We evaluate 3 commercial gender classification systems using our dataset and show that darker-skinned females are the most misclassified group (with error rates of up to 34.7%). The maximum error rate for lighter-skinned males is 0.8%." [S41]
33. **Joy Buolamwini (TEDxBeaconStreet, recorded 19 Nov 2016):** "Why am I sitting in front of a computer in a white mask, trying to be detected by a cheap webcam?" [S42]
34. **ACM (27 Mar 2019):** "Though their efforts to rekindle the AI community's interest in neural networks were initially met with skepticism, their ideas recently resulted in major technological advances, and their methodology is now the dominant paradigm in the field." [S43]
35. **Gideon Lewis-Kraus, NYT Magazine (14 Dec 2016):** "The A.I. system had demonstrated overnight improvements roughly equal to the total gains the old one had accrued over its entire lifetime." [S13]
36. **Geoffrey Hinton (via Wired/Metz 2021):** "I last sat down in 2005… and it was a mistake." [S21]. Reported as something he "often said".

**UNVERIFIED — do not use as quotes:**
- Lee Sedol, before the match: "I believe human intuition is still too advanced for AI to have caught up". Widely circulated, but not found in a source read this pass. Use the Guardian's paraphrase ("confident of a sweeping victory") [S24] instead.
- Demis Hassabis: "Solve intelligence, and then use that to solve everything else". This exact wording remains untraced. **Verified alternative (fact-check):** MIT Technology Review (Tom Simonite, 31 Mar 2016) writes that Hassabis describes his effort as "the Apollo program of artificial intelligence, aimed at “solving intelligence, and then using that to solve everything else.”" The quoted fragment sits inside the reporter's sentence, so use it as "in Hassabis's phrase, as reported by MIT Technology Review" [S46].
- Andrew Ng: "AI is the new electricity". Real slogan (c. 2016–17), but not traced to a primary source here.
- Hinton (Axios 2017): "My view is throw it all away and start again". The Axios page was unreadable.
- Any quote of Goodfellow's from the night at Les 3 Brasseurs. MIT TR paraphrases him, so there are no direct quotes.

---

## 7. Debates and controversies

**1. Does king − man + woman really equal queen?**
- *Pro:* Mikolov et al. reported systematic linear offsets and benchmark accuracy on thousands of analogy questions [S1][S2].
- *Contra:* Nissim et al. showed the method's code excludes input words. Unconstrained, accuracy on the same set drops from 0.74 to 0.21, and "man is to king as woman is to king" [S7]. Linzen (2016) and Schluter (2018) are cited there as finding the same drop [S7].
- *Resolution:* the vectors do encode relational regularities. But the famous demo overstates them. The film should say "lands near queen, once you rule out king itself".

**2. Embeddings and bias.**
- Bolukbasi et al. (2016) showed embeddings encode gender stereotypes and proposed debiasing [S6].
- Nissim et al. (2019) argued that some famous biased analogies were artefacts of the same constraint, plus analysts' choices of which queries to report: "man is to doctor as woman is to doctor" [S7]. They did **not** deny bias exists, but objected to "sensational" analogy demos [S7].
- Contested framing: present both.

**3. Who invented attention / seq2seq?**
- Bahdanau et al. is the standard citation for neural attention in translation [S10].
- Sutskever et al. and Cho et al. published encoder–decoders in the same summer [S8][S9]. Kalchbrenner & Blunsom (2013) had an earlier recurrent continuous translation model [KNOWLEDGE].
- In December 2023 Mikolov publicly claimed that seq2seq ideas had been discussed earlier at Google. That is [UNVERIFIED]; it was not read this pass, so do not use it.
- Keep the framing to "in the same summer, three groups…".

**4. GAN priority.**
- Jürgen Schmidhuber argues GANs are "special cases" of his 1990 "Artificial Curiosity" and closely related to his 1991 "Predictability Minimization" [S16].
- Goodfellow and most of the field treat GANs as a distinct contribution. A public exchange at the NIPS 2016 GAN tutorial is widely reported [KNOWLEDGE].
- Mark contested. Do not adjudicate.

**5. The GAN origin story.** It is a single-source anecdote: Goodfellow's account to MIT TR [S15]. Present it as "as he tells it".

**6. Was AlphaGo "creative"?**
- Fan Hui ("So beautiful") [S26] and Lee Sedol, as quoted by DeepMind ("Surely, AlphaGo is creative") [S28].
- Skeptics argue that move 37 was the output of search and value estimation, and that "creativity" is anthropomorphic [KNOWLEDGE; a general debate].
- Lee himself, in 2019, attributed his own game-4 win to a bug in AlphaGo (Yonhap's paraphrase, not a direct quote), which complicates the romantic reading of move 78 [S29].

**7. The DeepMind acquisition price.**
- The Guardian reported £400m ($650m) in its text but captioned its photo "around $400m" [S19]. Other outlets reported $400m+; Wikipedia summarises the reports as $400m–$650m [S20]. Neither company confirmed a figure. **CONTESTED: say "a reported £400 million" or "hundreds of millions of dollars".**
- The ethics board was reported by The Information via the Guardian [S19]. Its membership was never disclosed [S20].
- The Guardian (2014) called DeepMind "two-year-old" and said Hassabis "left academia in 2012 to found" it. Companies House records incorporation on 23 September 2010 [S20]. **Use 2010.**

**8. OpenAI's openness and mission.**
- In 2015 Altman said "anything the group develops will be available to everyone" [S33]. OpenAI later moved away from that, and later disputes (Musk's departure, the 2019 capped-profit structure) belong to the next dossiers [KNOWLEDGE].
- The film should state the 2015 mission as written and flag that it changed later.

**9. Deep learning's limits (Marcus vs the field).**
- Marcus (Jan 2018): ten concerns; the field should add symbolic and innate structure [S40].
- Supporters of deep learning (LeCun, Bengio, Hinton) countered at the time that many limits were research problems within deep learning. They held public debates, e.g. Marcus–LeCun at NYU, 5 October 2017: "Does Artificial Intelligence Need More Innate Machinery?", hosted by the NYU Center for Mind, Brain and Consciousness. LeCun argued for general learning mechanisms; Marcus for "much more innate domain-specific machinery" [S47; VERIFIED-PRIMARY in fact-check].
- *Status:* still contested as of 2026 (see `reasoning-agents-current-understanding`).

**10. Adversarial examples: bug or feature?**
- Szegedy et al. framed them as "blind spots" connected to discontinuity [S38]. Goodfellow et al. argued for excess linearity [S39].
- Later work (e.g. Ilyas et al. 2019, "Adversarial Examples Are Not Bugs, They Are Features") argued for non-robust but predictive features [KNOWLEDGE].
- Contested to this day.

**11. Gender Shades and the companies.** The paper audited Microsoft, Face++ and IBM [S41]. The follow-up audit, Raji & Buolamwini, "Actionable Auditing" (AIES, January 2019), found that "within 7 months of the original audit… all three targets released new API versions". Error on darker-skinned females fell by 17.7–30.4%. Non-audited Amazon and Kairos showed error rates of 31.37% and 22.50% on that subgroup [S48; VERIFIED-PRIMARY in fact-check, correcting the earlier "IBM and Microsoft" to all three targets].

**12. "Fathers of the deep learning revolution".** The ACM framing [S43] is contested by those who stress earlier and parallel contributors: Schmidhuber's group, Fukushima, the Soviet and Ukrainian work of Ivakhnenko, and others (see `classical-ml-era` and `connectionist-revival-backprop`). Mark the title as ACM's own phrase.

---

## 8. Misconceptions to avoid

1. **"word2vec is a deep neural network."** It is a deliberately shallow, log-linear model; its authors removed the non-linear hidden layer [S1].
2. **"king − man + woman = queen exactly."** The vector lands *near* queen, and the standard code excludes "king" from the answers [S2][S7].
2a. **"A single LSTM scored 34.8 BLEU."** The 34.8 came from an ensemble of five LSTMs; the best single network scored 30.6 [S8].
3. **"Seq2seq introduced attention."** Sutskever et al. used no attention: one fixed vector, plus source reversal. Attention came from Bahdanau, Cho & Bengio [S8][S10].
4. **"Attention immediately beat phrase-based translation."** In 2014 RNNsearch beat Moses only on sentences without unknown words (36.15 vs 35.63). On all sentences Moses still led, 33.30 vs 28.45 [S10].
5. **"GNMT reached human quality."** The paper says it reduced errors by about 60% in side-by-side ratings "on a set of isolated simple sentences". The blog lists its remaining errors [S11][S12].
6. **"DQN beat humans at Atari."** It reached more than 75% of a professional tester's score on 29 of 49 games, and failed badly at Montezuma's Revenge [S18].
7. **"AlphaGo taught itself Go from scratch."** The 2016 AlphaGo learned first from 30 million positions from human games on KGS. Only AlphaGo Zero (2017) used no human data [S23][S30].
8. **"Move 37 had a 1-in-10,000 chance of being a good move."** The figure is the policy network's estimate that a *human* would play it. AlphaGo's search then judged it strong [S27].
9. **"AlphaGo ran on a laptop" or "on one machine."** The Fan Hui version used 1,202 CPUs and 176 GPUs, and the Lee version 48 TPUs. AlphaGo Zero *played* its evaluation matches on a single machine with 4 TPUs, but was *trained* on Google Cloud with 64 GPU workers and 19 CPU parameter servers [S23][S30].
10. **"Lee Sedol lost 5–0."** He won game 4, the only game a human ever won against AlphaGo in a formal match [S29].
11. **"Fan Hui lost every game."** He lost the five formal games but won two of the five informal fast games [S23].
12. **"DeepMind was founded in 2012" or "Google founded DeepMind."** It was incorporated in September 2010 and acquired in January 2014 [S20][S19].
13. **"Elon Musk founded OpenAI."** Altman and Musk were co-chairs. Sutskever was research director and Brockman CTO, with seven other founding members and several donors [S32].
14. **"OpenAI raised $1 billion in 2015."** Funders *committed* $1 billion, and OpenAI said it expected to "spend a tiny fraction of this in the next few years" [S32].
15. **"Goodfellow discovered adversarial examples."** Szegedy et al. (Dec 2013) did, with Goodfellow as a co-author. Goodfellow's 2014 paper explained them and gave the fast gradient sign method [S38][S39].
16. **"Gender Shades tested facial recognition (identity)."** It tested **gender classification** in commercial face-analysis APIs [S41].
17. **"The 2019 Turing Award."** It is the **2018** A.M. Turing Award, announced in March 2019 [S43].
18. **"GANs produced photorealistic faces in 2014."** The 2014 samples were small and blurry; photorealism came years later [KNOWLEDGE].
19. **"Baidu hired Hinton."** Baidu bid in the DNNresearch auction, but Hinton chose Google [S21]. Baidu hired Andrew Ng in 2014 [S37].

---

## 9. Curiosity hooks

1. **The answer is hidden by the rules.** The famous "queen" appears partly because the code forbids repeating the question's own words. Lift that filter and, across Google's analogy test, accuracy falls from 74% to 21%, mostly because the method answers with one of the question's own words: "man is to king as woman is to king" [S7].
2. **Read it backwards.** Google's 2014 translation network worked markedly better when the English sentence was fed in **backwards**. Its authors wrote that they "were surprised by the extent of the improvement" [S8].
3. **One computer, eight brains.** Each 2014 seq2seq model ran on a single eight-GPU machine, one LSTM layer per GPU, and trained for about ten days. The headline score came from five such models voting together [S8].
4. **A machine dug a tunnel.** DeepMind's Atari agent discovered on its own that the best way to play Breakout is to bore a tunnel up the side of the wall and let the ball rampage behind it [S18]. Yet it scored next to nothing on Montezuma's Revenge, a game requiring long plans [S18].
5. **Move 37 was really move 19.** AlphaGo's famous stone was the 37th move of the game but only the machine's 19th, and Wired's live report called it "its 19th move" [S25][S26]. AlphaGo itself estimated a one-in-ten-thousand chance that a human would play it [S27].
6. **Two one-in-ten-thousand moves.** Three days after move 37, Lee Sedol's move 78 was one that AlphaGo, by Hassabis's account, had *also* rated at one in ten thousand [S27].
7. **The loser got better.** Fan Hui was ranked 633rd in the world when AlphaGo beat him. After months of sparring with the machine he rose "into the 300s" [S26].
8. **Seventy-two hours.** AlphaGo Zero began by playing random moves. Three days later, playing on a single 4-TPU machine (it was trained on a cloud cluster), it beat the version that had beaten Lee Sedol, 100 games to 0 [S30].
9. **A $1 billion pledge that wasn't spent.** OpenAI's founders announced a $1 billion commitment while saying they expected to "spend a tiny fraction of this in the next few years" [S32].
10. **The white mask.** Joy Buolamwini's facial-analysis project couldn't see her face until she held up a white mask. That moment led to an audit showing commercial systems misgendering darker-skinned women up to 34.7% of the time [S42][S41].
11. **Go's "intuition".** In 2014 a Go professional told Wired, "I'll see a move and be sure it's the right one, but won't be able to tell you exactly how I know. I just see it." Two years later, a network trained by gradient descent produced moves professionals called beautiful [S22][S26]. (The speaker in Wired is the commentator Michael Redmond.)
12. **The panda that became a gibbon.** Adding noise scaled to the smallest step of an 8-bit pixel turned GoogLeNet's 57.7% "panda" into a 99.3% "gibbon" [S39].
13. **Translation's overnight leap.** In November 2016 a Tokyo professor noticed Google Translate had changed overnight. The neural system, built in nine months, had matched the old system's lifetime of gains [S13].

---

## 10. Visual and dramatic details

**Seoul, March 2016 (AlphaGo vs Lee Sedol).** The match was held in the towering Four Seasons hotel in downtown Seoul, on the Sejong-daero boulevard [S26][S27].
- **The table:** a wooden goban (Go board) on a raised table, with lidded bowls of black and white stones. Lee Sedol in a dark suit sat opposite Aja Huang, who read AlphaGo's moves off a monitor and placed the stones [S24].
- **Lee's posture:** "leaning forward, cradling his chin in his hand". Before game 1 he bowed to "an opponent who could neither see him nor sense his presence" [S24].
- **Clocks and screens:** time clocks; a separate commentary room with large screens. Michael Redmond (9-dan, American) and Chris Garlock commentated in English [S24][S27]. Korean TV anchors broadcast from the venue [S27 photo caption].
- **Move 37:** Lee "stood up and left the match room" and came back to think for "nearly fifteen minutes" [S26][S27].
- **Mood:** "The mood inside the Four Seasons dipped" after game 3 [S27]. Afterwards Hassabis walked the boulevard and passers-by "treated him like a celebrity" [S27].
- **Scale:** "more than 8 million people play the game of Go" in Korea [S27]. Weather in Seoul in mid-March is cool, early spring [KNOWLEDGE; not verified].
- **Art suggestion:** a silhouette goban seen from above. One black stone lands on an open right-hand side, with a ripple of ink. A single empty chair as Lee steps out.

**London, October 2015 (Fan Hui match).** A "closed-door match inside DeepMind headquarters" [S25], with an impartial referee [S23]. DeepMind was then based near King's Cross [KNOWLEDGE for the 2015 address; S20 gives the current HQ at Kings Cross].

**Tokyo, March 2014 (UEC Cup / Densei-sen).** "A dingy conference room with faux-wood paneling and garish fluorescent lights"; spectators before "an old projector screen" [S22].
- Coulom wore "a blue turtleneck sweater". The professional Norimoto Yoda wore "an olive green kimono" and held "a folded fan", and was known "for shattering Go stones when he slams them down on the hardwood goban" [S22].
- Crazy Stone started with four black handicap stones on the corner star points [S22].
- This is a perfect contrast scene for "before": the human sage in a kimono, the laptop and a four-stone head start.

**Montréal, 2014.**
- Les 3 Brasseurs (The Three Brewers), a brewpub; beer; a celebratory gathering for a newly graduated PhD student [S15].
- Then a dark apartment, a sleeping partner, and a programmer at a laptop "into the early hours" [S15].
- Montréal winters are cold, but the season of the night is not stated. Do not depict snow unless sourced.

**Lake Tahoe, December 2012 and December 2013 (NIPS at Harrah's and Harveys).**
- **2012:** the DNNresearch auction, run by email from Harrah's room 731. The hotel steakhouse was "decorated with a thousand wine bottles", and it was Hinton's 65th birthday at dinner. Alan Eustace flew "his own twin-engine plane" in [S21].
- **2013:** Zuckerberg and Schroepfer appeared at NIPS; the FAIR announcement came at the Deep Learning Workshop [S36].
- **Art:** casino carpets, a mountain lake in winter, laptops refreshing email.

**Google, Mountain View, 2013–2016.**
- Word vectors trained on Google News text [S1].
- An eight-GPU server for seq2seq [S8].
- TPUs in data-centre racks for GNMT [S12]. The TPU was a custom chip; its appearance (a board with heat sinks) is [KNOWLEDGE].

**Atari 2600.**
- The original 1977 console: woodgrain front, black plastic, a joystick with one red button [KNOWLEDGE].
- DQN saw only an emulator's 210×160 frames with 128 colours, down-sampled to small grey squares [S17].
- **Art:** the Breakout wall with a tunnel cut up one side and the ball bouncing behind it [S18].

**MIT Media Lab, 2016.** A desk, a cheap webcam, and a white theatrical mask held up to the camera [S42].

**San Francisco, 15 June 2019.** The ACM awards banquet, with Bengio, Hinton and LeCun in formal wear [S43]. Hinton is known to avoid sitting, so depict him standing [S21].

**Period details, 2013–2017.**
- MacBook Pros with stickers; whiteboards dense with equations.
- NVIDIA GPU cards (Titan and Quadro K6000 [S10]).
- The rise of arXiv as the place results appear first: every paper in this dossier was on arXiv before publication.

---

## 11. Sources

1. [S1] Mikolov, Chen, Corrado & Dean, "Efficient Estimation of Word Representations in Vector Space", arXiv 1301.3781 (16 Jan 2013). https://arxiv.org/abs/1301.3781 · PDF https://arxiv.org/pdf/1301.3781
2. [S2] Mikolov, Yih & Zweig, "Linguistic Regularities in Continuous Space Word Representations", NAACL-HLT 2013. https://aclanthology.org/N13-1090.pdf
3. [S3] Mikolov, Sutskever, Chen, Corrado & Dean, "Distributed Representations of Words and Phrases and their Compositionality", arXiv 1310.4546 (16 Oct 2013), NIPS 2013. https://arxiv.org/abs/1310.4546
4. [S4] Google Open Source Blog, "Learning the meaning behind words" (14 Aug 2013), by Mikolov, Sutskever & Le. https://opensource.googleblog.com/2013/08/learning-meaning-behind-words.html
5. [S5] NeurIPS Blog, "Announcing the NeurIPS 2023 Paper Awards" (Test of Time). https://blog.neurips.cc/2023/12/11/announcing-the-neurips-2023-paper-awards/
6. [S6] Bolukbasi, Chang, Zou, Saligrama & Kalai, "Man is to Computer Programmer as Woman is to Homemaker? Debiasing Word Embeddings", arXiv 1607.06520 (21 Jul 2016). https://arxiv.org/abs/1607.06520
7. [S7] Nissim, van Noord & van der Goot, "Fair is Better than Sensational: Man is to Doctor as Woman is to Doctor", arXiv 1905.09866 (2019; *Computational Linguistics* 2020). https://arxiv.org/abs/1905.09866
8. [S8] Sutskever, Vinyals & Le, "Sequence to Sequence Learning with Neural Networks", arXiv 1409.3215 (10 Sep 2014). https://arxiv.org/abs/1409.3215
9. [S9] Cho et al., "Learning Phrase Representations using RNN Encoder–Decoder for Statistical Machine Translation", arXiv 1406.1078 (3 Jun 2014). https://arxiv.org/abs/1406.1078
10. [S10] Bahdanau, Cho & Bengio, "Neural Machine Translation by Jointly Learning to Align and Translate", arXiv 1409.0473 (1 Sep 2014; ICLR 2015 oral). https://arxiv.org/abs/1409.0473
11. [S11] Wu et al., "Google's Neural Machine Translation System: Bridging the Gap between Human and Machine Translation", arXiv 1609.08144 (26 Sep 2016). https://arxiv.org/abs/1609.08144
12. [S12] Le & Schuster, "A Neural Network for Machine Translation, at Production Scale", Google Research Blog (27 Sep 2016). https://research.google/blog/a-neural-network-for-machine-translation-at-production-scale/
13. [S13] Gideon Lewis-Kraus, "The Great A.I. Awakening", *New York Times Magazine* (14 Dec 2016; print 18 Dec 2016, MM40, "Going Neural"). https://www.nytimes.com/2016/12/14/magazine/the-great-ai-awakening.html · read via https://web.archive.org/web/2017/https://www.nytimes.com/2016/12/14/magazine/the-great-ai-awakening.html
14. [S14] Goodfellow et al., "Generative Adversarial Nets", arXiv 1406.2661 (10 Jun 2014), NIPS 2014. https://arxiv.org/abs/1406.2661
15. [S15] Martin Giles, "The GANfather: The man who's given machines the gift of imagination", *MIT Technology Review* (21 Feb 2018). https://www.technologyreview.com/2018/02/21/145289/the-ganfather-the-man-whos-given-machines-the-gift-of-imagination/
16. [S16] Schmidhuber, "Generative Adversarial Networks are Special Cases of Artificial Curiosity (1990) and also Closely Related to Predictability Minimization (1991)", arXiv 1906.04493; *Neural Networks* 127 (2020). https://arxiv.org/abs/1906.04493
17. [S17] Mnih et al., "Playing Atari with Deep Reinforcement Learning", arXiv 1312.5602 (19 Dec 2013). https://arxiv.org/abs/1312.5602
18. [S18] Mnih et al., "Human-level control through deep reinforcement learning", *Nature* 518, 529–533 (online 25 Feb 2015). https://www.nature.com/articles/nature14236 · PDF https://storage.googleapis.com/deepmind-media/dqn/DQNNaturePaper.pdf
19. [S19] Samuel Gibbs, "Google buys UK artificial intelligence startup Deepmind for £400m", *The Guardian* (27 Jan 2014). https://www.theguardian.com/technology/2014/jan/27/google-acquires-uk-artificial-intelligence-startup-deepmind
20. [S20] "Google DeepMind", Wikipedia (incorporation 23 Sep 2010 per Companies House; acquisition 26 Jan 2014). https://en.wikipedia.org/wiki/Google_DeepMind · Companies House 07386350: https://find-and-update.company-information.service.gov.uk/company/07386350
21. [S21] Cade Metz, "The Secret Auction That Set Off the Race for AI Supremacy", *Wired* (16 Mar 2021; excerpt from *Genius Makers*). https://www.wired.com/story/secret-auction-race-ai-supremacy-google-microsoft-baidu/
22. [S22] Alan Levinovitz, "The Mystery of Go, the Ancient Game That Computers Still Can't Win", *Wired* (12 May 2014). https://www.wired.com/2014/05/the-world-of-computer-go/
23. [S23] Silver et al., "Mastering the game of Go with deep neural networks and tree search", *Nature* 529, 484–489 (online 27 Jan 2016). https://www.nature.com/articles/nature16961 · PDF https://storage.googleapis.com/deepmind-media/alphago/AlphaGoNaturePaper.pdf
24. [S24] Steven Borowiec, "Google's AlphaGo AI defeats human in first game of Go contest", *The Guardian* (9 Mar 2016). https://www.theguardian.com/technology/2016/mar/09/google-deepmind-alphago-ai-defeats-human-lee-sedol-first-game-go-contest
25. [S25] Cade Metz, "Google's AI Wins Pivotal Second Game in Match With Go Grandmaster", *Wired* (10 Mar 2016). https://www.wired.com/2016/03/googles-ai-wins-pivotal-game-two-match-go-grandmaster/
26. [S26] Cade Metz, "The Sadness and Beauty of Watching Google's AI Play Go", *Wired* (11 Mar 2016). https://www.wired.com/2016/03/sadness-beauty-watching-googles-ai-play-go/
27. [S27] Cade Metz, "In Two Moves, AlphaGo and Lee Sedol Redefined the Future", *Wired* (16 Mar 2016). https://www.wired.com/2016/03/two-moves-alphago-lee-sedol-redefined-future/
28. [S28] Google DeepMind, "AlphaGo" (research breakthroughs page). https://deepmind.google/research/breakthroughs/alphago/
29. [S29] Yoo Cheong-mo, "(Yonhap Interview) Go master Lee says he quits unable to win over AI Go players", Yonhap (27 Nov 2019). https://en.yna.co.kr/view/AEN20191127004800315
30. [S30] Silver et al., "Mastering the game of Go without human knowledge", *Nature* 550, 354–359 (19 Oct 2017). https://www.nature.com/articles/nature24270 · author manuscript https://discovery.ucl.ac.uk/id/eprint/10045895/1/agz_unformatted_nature.pdf
31. [S31] DeepMind, "AlphaGo Zero: Starting from scratch" (Oct 2017). https://deepmind.google/discover/blog/alphago-zero-starting-from-scratch/
32. [S32] Greg Brockman, Ilya Sutskever and the OpenAI team, "Introducing OpenAI" (11 Dec 2015). https://openai.com/index/introducing-openai/ · read via https://web.archive.org/web/2016/https://openai.com/blog/introducing-openai/
33. [S33] Steven Levy, "How Elon Musk and Y Combinator Plan to Stop Computers From Taking Over", Backchannel/*Wired* (11 Dec 2015). https://www.wired.com/2015/12/how-elon-musk-and-y-combinator-plan-to-stop-computers-from-taking-over/
34. [S34] Samuel Gibbs, "Elon Musk: artificial intelligence is our biggest existential threat", *The Guardian* (27 Oct 2014). https://www.theguardian.com/technology/2014/oct/27/elon-musk-artificial-intelligence-ai-biggest-existential-threat
35. [S35] "Facebook Taps 'Deep Learning' Giant for New AI Lab", *Wired* (9 Dec 2013). https://www.wired.com/2013/12/facebook-yann-lecun/
36. [S36] Yann LeCun, Facebook post (9 Dec 2013). https://www.facebook.com/yann.lecun/posts/10151728212367143 · read via https://web.archive.org/web/2014/https://www.facebook.com/yann.lecun/posts/10151728212367143
37. [S37] "Man Behind the 'Google Brain' Joins Chinese Search Giant Baidu", *Wired* (16 May 2014). https://www.wired.com/2014/05/andrew-ng-baidu/
38. [S38] Szegedy, Zaremba, Sutskever, Bruna, Erhan, Goodfellow & Fergus, "Intriguing properties of neural networks", arXiv 1312.6199 (21 Dec 2013). https://arxiv.org/abs/1312.6199
39. [S39] Goodfellow, Shlens & Szegedy, "Explaining and Harnessing Adversarial Examples", arXiv 1412.6572 (20 Dec 2014; ICLR 2015). https://arxiv.org/abs/1412.6572
40. [S40] Gary Marcus, "Deep Learning: A Critical Appraisal", arXiv 1801.00631 (2 Jan 2018). https://arxiv.org/abs/1801.00631
41. [S41] Buolamwini & Gebru, "Gender Shades: Intersectional Accuracy Disparities in Commercial Gender Classification", *PMLR* 81:1–15 (FAT* 2018). https://proceedings.mlr.press/v81/buolamwini18a.html · PDF https://proceedings.mlr.press/v81/buolamwini18a/buolamwini18a.pdf
42. [S42] Joy Buolamwini, "How I'm fighting bias in algorithms", TEDxBeaconStreet (recorded 19 Nov 2016), transcript. https://www.ted.com/talks/joy_buolamwini_how_i_m_fighting_bias_in_algorithms/transcript
43. [S43] ACM press release, "Fathers of the Deep Learning Revolution Receive ACM A.M. Turing Award" (27 Mar 2019). https://www.acm.org/media-center/2019/march/turing-award-2018 · read via https://web.archive.org/web/2019/https://www.acm.org/media-center/2019/march/turing-award-2018
44. [S44] ACM, "2018 Turing Award" page. https://awards.acm.org/about/2018-turing
45. [S45] "AlphaGo versus Lee Sedol", Wikipedia (game dates and results). https://en.wikipedia.org/wiki/AlphaGo_versus_Lee_Sedol
46. [S46] Tom Simonite, "How Google Plans to Solve Artificial Intelligence", *MIT Technology Review* (31 Mar 2016). https://www.technologyreview.com/2016/03/31/161234/how-google-plans-to-solve-artificial-intelligence/
47. [S47] NYU Center for Mind, Brain and Consciousness, "Does Artificial Intelligence Need More Innate Machinery?" (debate, 5 Oct 2017). https://wp.nyu.edu/consciousness/innate-ai/
48. [S48] Raji & Buolamwini, "Actionable Auditing: Investigating the Impact of Publicly Naming Biased Performance Results of Commercial AI Products", AIES 2019 (MIT Media Lab publication page, 24 Jan 2019). https://www.media.mit.edu/publications/actionable-auditing-investigating-the-impact-of-publicly-naming-biased-performance-results-of-commercial-ai-products/
49. [S49] Companies House, DEEPMIND TECHNOLOGIES LIMITED, company 07386350 (incorporated 23 Sep 2010 as Friars 2022 Limited; renamed 15 Nov 2010). https://find-and-update.company-information.service.gov.uk/company/07386350

---

## 12. Verification log (2026-10-05)

- **Exact wording checked in the source text.** All numbers in sections 5.1–5.11 and all of quotes 1–36 were checked against the text of the cited source.
- **Corrections made while drafting.**
  - DeepMind founding: corrected to 2010, against the Guardian's "two-year-old".
  - Attention vs Moses: clarified with the full BLEU table.
  - Fan Hui's 3–2 informal record: added.
  - Move 37 as AlphaGo's 19th stone: added.
  - AlphaGo Master: corrected to 89–11 against AlphaGo Zero (40-day version).
  - Lee Sedol's pre-match quote: downgraded to UNVERIFIED.
- **Gaps for the adversarial fact-checker.**
  - Game 5 date (15 Mar 2016).
  - Andrew Ng's title at Baidu.
  - Mikolov's 2014 move to FAIR.
  - The Marcus–LeCun NYU debate date.
  - The Raji & Buolamwini 2019 follow-up.
  - Physical appearance notes (all KNOWLEDGE).
  - Seoul weather.
  - The Axios Hinton original.
  - Hassabis's "solve intelligence" wording.

---

## 13. Fact-check log (adversarial pass, 2026-10-05)

Method: every primary PDF was downloaded again (arXiv 1301.3781, 1310.4546, 1312.5602, 1312.6199, 1406.2661, 1409.0473, 1409.3215, 1412.6572, 1607.06520, 1609.08144, 1801.00631, 1905.09866; ACL N13-1090; DeepMind-hosted DQN and AlphaGo Nature PDFs; the UCL AlphaGo Zero manuscript; PMLR Gender Shades). Their text was searched directly for every number and quote. arXiv first-submission dates were re-checked through the arXiv API. They all match the dossier: 16 Jan 2013, 16 Oct 2013, 19 Dec 2013, 21 Dec 2013, 3 Jun 2014, 10 Jun 2014, 1 Sep 2014, 10 Sep 2014, 20 Dec 2014, 21 Jul 2016, 26 Sep 2016, 2 Jan 2018 and 23 May 2019. Nature landing pages confirm DQN (published 25 Feb 2015, issue 26 Feb), AlphaGo (27 Jan 2016, issue 28 Jan) and AlphaGo Zero (19 Oct 2017). Each news quote was re-located in its saved article text.

**Corrections**
1. **Seq2seq 34.8 BLEU was an ensemble.** The paper says: "a BLEU score of 34.81 by directly extracting translations from an ensemble of 5 deep LSTMs (with 384M parameters and 8,000 dimensional state each)". Single networks scored 26.17 (forward input) and 30.59 (reversed). Fixed in §1, §5.2, §8 and §9. [S8] https://arxiv.org/pdf/1409.3215
2. **AlphaGo Zero's 4-TPU machine was its playing hardware, not its training hardware.** Training: "optimised on the Google Cloud using TensorFlow, with 64 GPU workers and 19 CPU parameter servers". Fixed in §1, §5.8, §8 #9 and §9 #8. [S30] https://discovery.ucl.ac.uk/id/eprint/10045895/1/agz_unformatted_nature.pdf
3. **Marcus misquote.** "the beginning of the resurgence" was presented as Marcus's 2012 description of deep learning. It actually describes *when* he warned: "approaching a wall, much as I anticipated earlier, at beginning of the resurgence (Marcus, 2012)". Fixed in §4. [S40] https://arxiv.org/pdf/1801.00631
4. **Raji & Buolamwini 2019.** All three audited firms released new API versions within 7 months, not only IBM and Microsoft. Darker-female error fell by 17.7–30.4%; the non-targets Amazon and Kairos showed 31.37% and 22.50%. Fixed in §7.11. [S48]
5. **Marcus–LeCun debate dated:** 5 Oct 2017, NYU Center for Mind, Brain and Consciousness, "Does Artificial Intelligence Need More Innate Machinery?". Fixed in §2 and §7.9. [S47]
6. **DeepMind incorporation.** Company 07386350 was incorporated on 23 Sep 2010 as "Friars 2022 Limited" and renamed DeepMind Technologies Limited on 15 Nov 2010. Added to §2. [S49]
7. **"King" claim narrowed.** Nissim et al. report the aggregate collapse (0.74 → 0.21, "in most cases" the second term returned) and use "man is to king as woman is to king" as an illustration. They do not report the specific king query's output. Rephrased in §1, §5.1 and §9 #1. [S7] https://arxiv.org/pdf/1905.09866
8. **Attention training time.** The text says "approximately 5 days", but Table 2 gives RNNsearch-50★ (the model behind 28.45/36.15) 252 h ≈ 10.5 days. Fixed in §5.3. [S10] https://arxiv.org/pdf/1409.0473
9. **"zone économique européenne" example** upgraded from KNOWLEDGE to VERIFIED-PRIMARY (Fig. 3(a) of S10).
10. **Goodfellow linearity sentence** is verbatim from the abstract, not a paraphrase. Relabelled in §5.9. [S39]
11. **GAN origin story attribution.** MIT TR narrates it in the reporter's voice with no direct quote, so "by Goodfellow's own account" became "as MIT Technology Review tells it". Fixed in §1 and §5.5. [S15]
12. **Lee Sedol's "bug".** This is Yonhap's paraphrase ("Lee attributed his win to a bug in the AlphaGo program"), not a direct quote. Fixed in §5.7 and §7.6. [S29]
13. **DQN wording.** "at least 75%" became "more than 75%", the paper's wording. Fixed in §1 and §8. [S18]
14. **Hassabis "solve intelligence".** The dossier's wording stays UNVERIFIED. A verified alternative was added: MIT TR, 31 Mar 2016, "solving intelligence, and then using that to solve everything else" (a quoted fragment in the reporter's sentence). [S46]
15. **Verified, previously KNOWLEDGE.** Game 5 on 15 Mar 2016 (all game dates confirmed) [S45]; Ng's title, chief scientist; Mikolov's 2014 move to FAIR; Hassabis biography details (Wikipedia).

**Contested**
- **DeepMind price.** The Guardian's text says "£400m ($650m)" but its photo caption says "around $400m". Wikipedia summarises reports as $400m–$650m. No official figure exists. Marked CONTESTED in §1, §2 and §7.7. [S19][S20]

**Confirmed unchanged (key claims)** — word2vec abstract ("less than a day… 1.6 billion words"), 6B-token corpus, open-source blog 14 Aug 2013 by Mikolov, Sutskever & Le; NAACL "very close to “Queen.”" and "almost 40%"; Bolukbasi abstract and homemaker analogy; Nissim 0.74→0.21 and Table 2; seq2seq architecture, 8-GPU machine, 6,300 words/s, "about a ten days", reversal quotes; Bahdanau abstract and BLEU table (26.75/34.16, 28.45/36.15, Moses 33.30/35.63, 418M-word monolingual corpus); GNMT 8+8 layers, 60% "on a set of isolated simple sentences", 55%–85% (blog), 27 Sep 2016 launch, 100% Chinese→English, ~18M/day, TPUs; GAN counterfeiters/police and minimax wording, eight authors; Les 3 Brasseurs details; DQN 2013 (7 games, 6, 3) and 2015 (49, 43, 29, 50M frames ≈ 38 days, 1M replay, tunnel, Montezuma's Revenge); Guardian ethics board; Coulom "I think maybe ten years… But I do not like to make predictions" (12 May 2014; Coulom's sweater is "blue" in the Yoda scene); Redmond "I just see it"; AlphaGo "previously believed to be at least a decade away" (body) and "previously thought" (abstract); 30M KGS positions; 1,202 CPUs/176 GPUs; Fan Hui 5–0 / 3–2, 5–9 Oct 2015, 2 dan, champion 2013–15, 633rd; Four Seasons Seoul; move 37 as AlphaGo's 19th stone; Silver's one-in-ten-thousand; Fan Hui "It's not a human move…So beautiful" (Wired 11 Mar 2016); Lee quotes after games 1–3; Redmond on move 78; DeepMind page (4–1, 200 million, 9 dan, "Surely, AlphaGo is creative"); AlphaGo Zero 36 h, 72 h, 100–0, 4 vs 48 TPUs, 4.9M games, 40 days, 29M games, 89–11, Master 60–0; OpenAI announcement (11 Dec 2015, mission sentence, co-chairs, research director, CTO, $1B "committed… tiny fraction"); Altman to Levy; Musk "summoning the demon"; LeCun's FAIR post (9 Dec 2013, Menlo Park/London/NYC, NIPS Lake Tahoe, Deep Learning Workshop); Wired on Baidu (Cupertino outpost "Last year", Sunnyvale + Beijing, 16 May 2014); Szegedy abstract, ostrich figure, "blind spots"; FGSM 57.7%/8.2%/99.3%, ε = .007, 99.9%/79.3%; Marcus abstract, conclusion, Hinton and Chollet epigraphs; Gender Shades 1270 PPB (Rwanda, Senegal, South Africa / Iceland, Finland, Sweden), IJB-A 79.6%, Adience 86.2%, DF 20.8/34.5/34.7, LM 0.0/0.8/0.3, abstract wording; TEDxBeaconStreet recorded 19 Nov 2016 and "white mask… cheap webcam" quote; ACM citation, "initially met with skepticism", $1M funded by Google, 15 June banquet; NYT "overnight improvements" and "nine months"; Wired/Metz auction ($44m, Harrah's 731, four bidders incl. DeepMind, Hinton's 65th birthday, "I last sat down in 2005"); Yonhap 2019 quotes (interview "on Monday" = 25 Nov; letter 19 Nov); NeurIPS 2023 Test of Time ("cited over 40,000 times").

**Still unverifiable (unchanged status)**
- The Hinton Axios original (Sep 2017), including "throw it all away". Axios returned 403 and Wayback was unreachable, so cite the epigraph only as quoted by Marcus.
- The exact day of Musk's MIT remark (24 Oct 2014). The Guardian names the AeroAstro Centennial Symposium but gives no day.
- What the specific king − man + woman query returns unconstrained (see correction 7).
- Andrew Ng's "AI is the new electricity" and Lee Sedol's "human intuition is still too advanced" remain UNVERIFIED as before.
- The ACM press release's day (27 Mar 2019) matches the release URL (/2019/march/) and is widely reported, but the live ACM pages returned 403 in this pass.
