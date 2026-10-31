# Dossier: The ChatGPT Moment and the Frontier-Lab Race (2022–2024)

Topic id: `chatgpt-and-frontier-race` · Film: neural-net-history · As-of: 2026-10-05
Status: adversarially fact-checked on 2026-10-05 (see section 12, Fact-check log). Originally drafted from prior knowledge, then verified on 2026-10-05 against primary pages retrieved and read in this pass. Search-engine budget was exhausted early in this session, so verification used direct retrieval of primary documents (OpenAI, Anthropic, Microsoft, Google and Meta posts; arXiv; the Federal Register; GOV.UK; the European Parliament and Commission; the Cyberspace Administration of China; NobelPrize.org) plus archived press articles (NYT via the Wayback Machine, BBC, The Verge, The Guardian).

Tags:
- **[VERIFIED-PRIMARY]**: checked against the original document or the speaker's own published words, retrieved and read in this pass.
- **[VERIFIED-SECONDARY]**: checked against a reputable news report or reference work retrieved in this pass.
- **[UNVERIFIED]**: drafted from memory and not re-checked in this pass. Do not state it as fact or quote it without a further check.

Source numbers in square brackets, e.g. [S3], refer to section 11.

---

## 1. Summary

On **30 November 2022**, OpenAI released a free "research preview" called **ChatGPT**. OpenAI described it as "a sibling model to InstructGPT", "fine-tuned from a model in the GPT-3.5 series, which finished training in early 2022", trained with reinforcement learning from human feedback, and "trained on an Azure AI supercomputing infrastructure" [S1] [VERIFIED-PRIMARY].
- It was not a new kind of neural network. It was the transformer language model the film has already explained (the GPT line), plus fine-tuning on human-written dialogues and human rankings of answers, wrapped in a chat box anyone could use.
- What was new was **access**. Wikipedia, citing contemporary reporting, says ChatGPT "gained one million users in five days and 100 million in two months" [S2] [VERIFIED-SECONDARY].
  - The 100-million figure comes from a **UBS analyst note based on Similarweb web-traffic estimates**, reported by Reuters. OpenAI did not publish it [S2][S3].
  - OpenAI engineers said they had not expected ChatGPT to be very successful [S2].

The incumbents moved fast.
- **Microsoft** announced on **23 January 2023** "a multiyear, multibillion dollar investment" in OpenAI [S4] [VERIFIED-PRIMARY]. The widely reported figure of about $10 billion was not stated by Microsoft [UNVERIFIED as an official figure].
- **Google.** The New York Times reported on 21 December 2022 that ChatGPT's release led Google's management to declare a "code red" [S5] [VERIFIED-SECONDARY]. Sundar Pichai later denied to the Times that he had personally issued it [S7].
  - Google announced **Bard** on **6 February 2023** [S6] [VERIFIED-PRIMARY]. Bard's wrong answer about the James Webb Space Telescope (that JWST took the very first pictures of an exoplanet; the first such image was taken by ESO's Very Large Telescope in 2004) appeared in a **short promotional GIF video Google posted on Twitter**, not live on stage. Reuters spotted it. On Wednesday 8 February 2023, the day of Google's Paris AI event, Alphabet "lost $100 billion in market value ... after its new chatbot shared inaccurate information in a promotional video and a company event failed to dazzle". Shares slid as much as 9% during the day; Reuters' headline said "dive 8%" [S7a] [VERIFIED-SECONDARY]. *(Fact-check correction: the earlier draft placed the error "at its Paris demonstration".)*
  - Bard opened to the public on **21 March 2023**. Google announced **Gemini** on **6 December 2023** and renamed Bard "Gemini" on **8 February 2024** [S7] [VERIFIED-SECONDARY].
- **Meta** released **LLaMA** (7B to 65B parameters) to researchers on **24 February 2023**. Its weights leaked as a torrent posted on 4chan on **3 March 2023** [S9][S10] [VERIFIED-SECONDARY].
- **Anthropic**, founded in 2021 by former OpenAI staff, launched **Claude** on **14 March 2023** [S11] [VERIFIED-PRIMARY]. That was the same day OpenAI announced **GPT-4** [S16].

**GPT-4** was the shock of spring 2023. OpenAI's technical report said it passed a simulated Uniform Bar Exam at about the **90th percentile** (298/400). GPT-3.5 had scored about the 10th percentile [S16] [VERIFIED-PRIMARY]. The report also said it would give "no further details about the architecture (including model size), hardware, training compute, dataset construction, training method, or similar" [S16] [VERIFIED-PRIMARY].
- A week later, Microsoft researchers posted **"Sparks of Artificial General Intelligence"** (arXiv, 22 March 2023). It argued GPT-4 "could reasonably be viewed as an early (yet still incomplete) version of an artificial general intelligence (AGI) system" [S17] [VERIFIED-PRIMARY].
- Critics called the paper PR in a research paper's clothing [S18] [VERIFIED-SECONDARY].

**The risk debate of 2023** split the field into three camps.
1. **Existential-risk worriers.** The Future of Life Institute's open letter (dated 22 March 2023) called on labs to "immediately pause for at least 6 months the training of AI systems more powerful than GPT-4" [S20]. Geoffrey Hinton left Google (announced 1 May 2023) to speak freely [S23][S24]. On **30 May 2023**, the Center for AI Safety published a one-sentence statement: "Mitigating the risk of extinction from AI should be a global priority alongside other societal-scale risks such as pandemics and nuclear war." [S26][S27] [VERIFIED-PRIMARY].
2. **Present-harms ("AI ethics") critics.** Three listed authors of the "Stochastic Parrots" paper (Timnit Gebru, Emily M. Bender and Angelina McMillan-Major, per the DAIR page byline) said the letter's sensible recommendations "are overshadowed by fearmongering and AI hype", and that "Those hypothetical risks are the focus of a dangerous ideology called longtermism that ignores the actual harms resulting from the deployment of AI systems today" [S22] [VERIFIED-PRIMARY]. Margaret Mitchell, a co-author of the paper, criticised the letter separately to Reuters [S22a] [VERIFIED-SECONDARY].
3. **Sceptics of doom.** Yann LeCun, Meta's chief AI scientist and Hinton's fellow 2018 Turing laureate, called fears that a super-intelligent system would "take over the world within minutes" "preposterously ridiculous" [S28] [VERIFIED-SECONDARY].

**The OpenAI board crisis, 17–22 November 2023.**
- On Friday 17 November, OpenAI's nonprofit board fired CEO Sam Altman. It said he "was not consistently candid in his communications with the board" [S29] [VERIFIED-SECONDARY].
- Within five days, 745 of 770 employees reportedly signed a letter threatening to resign, Microsoft announced it would hire Altman, and board member Ilya Sutskever publicly recanted.
- An "agreement in principle" late on Tuesday 21 November (Pacific time) returned Altman with a new initial board: Bret Taylor, Larry Summers and Adam D'Angelo [S30][S31] [VERIFIED-SECONDARY].

**Governments responded in four different registers.**
- **USA.** **Executive Order 14110** (30 October 2023) required reports on models trained with more than 10^26 operations [S33] [VERIFIED-PRIMARY]. It was revoked on 20 January 2025 by EO 14148 [S34] [VERIFIED-PRIMARY].
- **UK summit.** The **Bletchley Declaration** (1–2 November 2023) was signed by 28 countries and the EU, **including both the United States and China**. It warned of "potential for serious, even catastrophic, harm" [S35] [VERIFIED-PRIMARY].
- **EU.** The **EU AI Act**: Parliament voted 523–46–49 on 13 March 2024 [S36]. The Act entered into force on 1 August 2024 [S37] [VERIFIED-PRIMARY].
- **China.** The **Interim Measures for the Management of Generative AI Services** were issued by seven agencies, published 13 July 2023 and in force from 15 August 2023 [S40] [VERIFIED-PRIMARY].

**October 2024: the Nobel twist.**
- **Physics** went to **John Hopfield and Geoffrey Hinton** "for foundational discoveries and inventions that enable machine learning with artificial neural networks" (8 October 2024) [S41].
- **Chemistry** went half to **David Baker** "for computational protein design" and half jointly to **Demis Hassabis and John Jumper** "for protein structure prediction" (9 October 2024) [S42] [VERIFIED-PRIMARY].
- Hinton took the call at about 2 a.m. in "a cheap hotel in California" [S43]. Some scientists asked whether the work was really physics. Dame Wendy Hall called it "a bit of a stretch" [S45] [VERIFIED-SECONDARY].

**Anthropic in this period** is reported here neutrally, on the same standard as every other lab.
- **Models:** Claude (March 2023), Claude 2 (11 July 2023), the Claude 3 family (Haiku/Sonnet/Opus, 4 March 2024), Claude 3.5 Sonnet (June 2024), and an upgraded 3.5 Sonnet with "computer use" (22 October 2024) [S11–S15].
- **Responsible Scaling Policy:** published 19 September 2023, with "AI Safety Levels" modelled on biosafety levels [S47].
- **Interpretability research:** sparse-autoencoder "dictionary learning" on a 512-neuron toy model (October 2023) [S48], scaled to Claude 3 Sonnet with up to ~34 million features (May 2024) [S49]. Its demo, "Golden Gate Claude", was online for 24 hours [S50].
- **Funding:** large investments from Amazon (up to $4 billion announced 25 September 2023: $1.25 billion initially, then $2.75 billion on 27 March 2024; a further $4 billion on 22 November 2024, bringing Amazon's total to $8 billion as a minority investor) [S51][S52][S54] and Google ($500 million upfront plus $1.5 billion over time, October 2023, per an Anthropic spokesperson quoted by Reuters) [S53a].

---

## 2. Timeline

| Date | Event | Sources | Tag |
|---|---|---|---|
| Jan 2021 (26 Jan = incorporation date per a business registry cited by Wikipedia) | Anthropic founded "by seven former employees of OpenAI" (Wikipedia body text); the infobox lists eight founders: Dario and Daniela Amodei, Jared Kaplan, Jack Clark, Chris Olah, Ben Mann, Sam McCandlish, Tom Brown. Say "former OpenAI researchers" rather than a count | [S53] | VERIFIED-SECONDARY (month); founder count inconsistent in source |
| Early 2022 | The GPT-3.5 model later fine-tuned into ChatGPT "finished training in early 2022" | [S1] | VERIFIED-PRIMARY |
| Apr 2022 | Anthropic reports $580M funding round incl. $500M from FTX under Sam Bankman-Fried | [S53] | VERIFIED-SECONDARY |
| **30 Nov 2022** (Wed) | OpenAI releases ChatGPT as a free research preview at chat.openai.com. Blog title: "ChatGPT: Optimizing Language Models for Dialogue" | [S1] | VERIFIED-PRIMARY |
| ~5 Dec 2022 | ChatGPT passes 1 million users (five days after launch; announced by Sam Altman on Twitter) | [S2] | VERIFIED-SECONDARY (exact tweet wording UNVERIFIED) |
| 21 Dec 2022 | NYT: ChatGPT's release "led Google's management to declare a 'code red'" | [S5] | VERIFIED-SECONDARY |
| Jan 2023 | ChatGPT "estimated to have reached 100 million monthly active users in January, just two months after launch" (UBS study citing Similarweb; about 13 million unique daily visitors in January). Reuters, Krystal Hu, 1 Feb 2023 | [S3] | VERIFIED-SECONDARY (Reuters retrieved via Wayback) |
| 23 Jan 2023 | Microsoft announces "third phase" of OpenAI partnership: "a multiyear, multibillion dollar investment" | [S4] | VERIFIED-PRIMARY |
| 6 Feb 2023 | Sundar Pichai blog post announces Bard | [S6] | VERIFIED-PRIMARY |
| 8 Feb 2023 | Google AI event in Paris "failed to dazzle"; the same day Reuters reported Bard's James Webb Space Telescope error in a Google **promotional GIF on Twitter** (not in the live demo); Alphabet loses ~$100bn of market value (shares down ~8%, as much as 9% intraday) | [S7a] | VERIFIED-SECONDARY |
| 24 Feb 2023 | Meta releases LLaMA (7B, 13B, 33B, 65B) to researchers on request; trained on 1.4 trillion tokens of public data; 13B beats GPT-3 (175B) on most benchmarks per Meta | [S8][S10] | VERIFIED-SECONDARY |
| 3 Mar 2023 | LLaMA weights leaked; torrent link posted on 4chan | [S9][S10] | VERIFIED-SECONDARY |
| **14 Mar 2023** | OpenAI announces GPT-4 (arXiv technical report v1 dated 15 Mar) | [S16] | VERIFIED-PRIMARY |
| **14 Mar 2023** | Anthropic launches Claude and Claude Instant, after closed alpha with Notion, Quora and DuckDuckGo | [S11] | VERIFIED-PRIMARY |
| 21 Mar 2023 | Bard opens to the public (US/UK waitlist) | [S7] | VERIFIED-SECONDARY |
| 22 Mar 2023 | "Sparks of Artificial General Intelligence: Early experiments with GPT-4" posted to arXiv (Bubeck + 13 authors, Microsoft Research) | [S17] | VERIFIED-PRIMARY |
| 22 Mar 2023 (dated); publicised 28–29 Mar | FLI "Pause Giant AI Experiments" letter. The DAIR statement says FLI "published" it on "Tuesday March 28" | [S20][S22] | VERIFIED-PRIMARY |
| 31 Mar 2023 | Three listed Stochastic Parrots authors (Gebru, Bender, McMillan-Major, per the DAIR byline) publish counter-statement; Margaret Mitchell criticises the letter separately to Reuters | [S22][S22a] | VERIFIED-PRIMARY |
| **1 May 2023** | NYT (Cade Metz, reported in Toronto): Hinton has quit Google to speak about AI risks | [S23] | VERIFIED-SECONDARY |
| 1 May 2023 | Hinton tweets: he left "so that I could talk about the dangers of AI without considering how this impacts Google. Google has acted very responsibly" | [S25] | VERIFIED-SECONDARY |
| 2 May 2023 | BBC interview with Hinton | [S24] | VERIFIED-SECONDARY |
| 16 May 2023 | NYT on the "Sparks" paper and its critics | [S18] | VERIFIED-SECONDARY |
| **30 May 2023** | CAIS one-sentence Statement on AI Risk released | [S26][S27] | VERIFIED-PRIMARY (text) / SECONDARY (date) |
| 13–14 Jun 2023 | LeCun, at a Meta press event in Paris, calls takeover fears "preposterously ridiculous" (BBC, Chris Vallance; published 14 Jun 2023 23:02 UTC = 15 Jun UK time) | [S28] | VERIFIED-SECONDARY |
| 11 Jul 2023 | Anthropic releases Claude 2 | [S12] | VERIFIED-PRIMARY |
| 10 Jul 2023 (signed) / 13 Jul 2023 (published) | China's seven agencies issue the Interim Measures for the Management of Generative AI Services (CAC Order No. 15), adopted by CAC on 23 May 2023 | [S40] | VERIFIED-PRIMARY |
| 15 Aug 2023 | China's Interim Measures take effect | [S40] | VERIFIED-PRIMARY |
| 19 Sep 2023 | Anthropic publishes its Responsible Scaling Policy | [S47] | VERIFIED-PRIMARY |
| 25 Sep 2023 | Amazon to invest up to $4bn in Anthropic; AWS to be "primary cloud provider" for mission-critical workloads; Trainium/Inferentia chips | [S51] | VERIFIED-PRIMARY |
| 4 Oct 2023 | Anthropic publishes "Towards Monosemanticity" | [S48] | VERIFIED-PRIMARY |
| 27 Oct 2023 | Reuters (Krystal Hu): Google agrees to invest up to $2bn in Anthropic ($500M upfront, $1.5B more over time), per an Anthropic spokesperson | [S53a] | VERIFIED-SECONDARY |
| **30 Oct 2023** | President Biden signs Executive Order 14110, "Safe, Secure, and Trustworthy Development and Use of Artificial Intelligence" | [S33] | VERIFIED-PRIMARY |
| **1–2 Nov 2023** | AI Safety Summit, Bletchley Park, UK; Bletchley Declaration signed by 28 countries and the EU, incl. US and China | [S35] | VERIFIED-PRIMARY |
| **17 Nov 2023** (Fri) | OpenAI board removes Altman; Mira Murati interim CEO; Greg Brockman quits | [S29][S31] | VERIFIED-SECONDARY |
| 19 Nov 2023 (Sun) | Altman at OpenAI HQ to negotiate; board instead names Emmett Shear (ex-Twitch CEO) interim CEO | [S31] | VERIFIED-SECONDARY |
| 20 Nov 2023 (Mon) | Microsoft says it will hire Altman and Brockman; staff letter (reported 745 of 770 signatories) demands board resign; Sutskever signs and apologises | [S31] | VERIFIED-SECONDARY |
| 21 Nov 2023 (Tue, late, Pacific time) | OpenAI: "agreement in principle" for Altman to return; new initial board Bret Taylor (chair), Larry Summers, Adam D'Angelo | [S30][S31] | VERIFIED-SECONDARY |
| 22 Nov 2023 | Altman's reinstatement reported (date used by Wikipedia; it was 22 Nov in UTC) | [S31] | VERIFIED-SECONDARY |
| 6 Dec 2023 | Google announces Gemini models | [S7] | VERIFIED-SECONDARY |
| 8 Dec 2023 | EU Parliament and Council reach political agreement on the AI Act (EP release refers to agreement "in December 2023") | [S36] | VERIFIED-PRIMARY (month) |
| 8 Feb 2024 | Bard renamed Gemini | [S7] | VERIFIED-SECONDARY |
| 4 Mar 2024 | Anthropic releases Claude 3 Haiku, Sonnet, Opus | [S13] | VERIFIED-PRIMARY |
| Mar 2024 | WilmerHale review finds Altman's conduct "did not mandate removal"; Altman rejoins OpenAI board | [S31] | VERIFIED-SECONDARY |
| 13 Mar 2024 | European Parliament adopts AI Act: 523 for, 46 against, 49 abstentions | [S36][S39] | VERIFIED-PRIMARY |
| 27 Mar 2024 | Amazon completes $4bn: additional $2.75bn ("Last September, we made an initial investment of $1.25 billion") | [S52] | VERIFIED-PRIMARY |
| 21 May 2024 | Council approves AI Act; Anthropic publishes "Scaling Monosemanticity" | [S39][S49] | VERIFIED |
| 23 May 2024 | "Golden Gate Claude" demo, online for 24 hours | [S50] | VERIFIED-PRIMARY |
| 20–21 Jun 2024 | Claude 3.5 Sonnet released (Anthropic page dated Jun 21, 2024; announced 20 June US time) | [S14] | VERIFIED-PRIMARY (page date) |
| 12 Jul 2024 | AI Act (Regulation (EU) 2024/1689) published in Official Journal | [S38][S39] | VERIFIED-SECONDARY |
| **1 Aug 2024** | AI Act enters into force | [S37] | VERIFIED-PRIMARY |
| **8 Oct 2024** | Nobel Prize in Physics: Hopfield and Hinton | [S41] | VERIFIED-PRIMARY |
| **9 Oct 2024** | Nobel Prize in Chemistry: Baker; Hassabis and Jumper | [S42] | VERIFIED-PRIMARY |
| 22 Oct 2024 | Anthropic: upgraded Claude 3.5 Sonnet, Claude 3.5 Haiku, "computer use" beta | [S15] | VERIFIED-PRIMARY |
| 23 Oct 2024 | New Zealand joins Bletchley Declaration | [S35] | VERIFIED-PRIMARY |
| 22 Nov 2024 | Amazon invests a further $4bn in Anthropic (total $8bn, minority stake); AWS becomes "primary cloud and training partner" | [S54] | VERIFIED-PRIMARY |
| 10 Dec 2024 | Hinton's Nobel banquet speech warns of "existential threat" | [S44] | VERIFIED-PRIMARY |
| 20 Jan 2025 | EO 14148 "Initial Rescissions of Harmful Executive Orders and Actions" revokes EO 14110 | [S34] | VERIFIED-PRIMARY |
| 2 Feb 2025 | AI Act bans on "unacceptable risk" uses apply (6 months after entry into force) | [S39] | VERIFIED-SECONDARY |

---

## 3. People

> Appearance notes are drawn from widely published photographs and are meant only for respectful silhouette work. **The art department should confirm each against licensed reference photographs.** None are claims about character. Ages are as of the event.

**Sam Altman**: CEO of OpenAI, San Francisco (Mission District headquarters in this era).
- **Beliefs:** publicly argued AGI was coming and should be built carefully but iteratively, by releasing products to learn from use. He signed the CAIS extinction-risk statement [S26].
- **Story role:** fired on 17 November 2023 and reinstated within five days [S29–S31].
- **Pictured:** slight, slim build; short dark hair; youthful face; usually casual (plain sweaters, jeans, sneakers). At the 2023 congressional and summit appearances, a dark suit, often without a tie [UNVERIFIED appearance].

**Ilya Sutskever**: co-founder and chief scientist of OpenAI and a board member in 2023. He was Hinton's former PhD student and co-author of AlexNet.
- **Beliefs:** deeply concerned with superintelligence safety.
- **Story role:** voted with the board to remove Altman, then signed the staff letter and publicly apologised [S31].
- **Pictured:** slim; receding or shaved hairline with dark short hair at the sides; intense expression; casual clothes [UNVERIFIED appearance].

**Mira Murati**: CTO of OpenAI. Named interim CEO on 17 November 2023 [S29] [VERIFIED-SECONDARY].
- **CONTESTED / later reporting:** Wikipedia's current account says the removal "was predicated by employee concerns, led by co-founder Ilya Sutskever and chief technology officer Mira Murati" about Altman's handling of safety, commercialisation and "allegations of lying and abusive behavior" [S31]. This rests on reporting published after the crisis; it was not public in November 2023. Attribute it to that later reporting and do not present it as established fact.
- **Pictured:** long dark hair; understated professional dress [UNVERIFIED appearance].

**Greg Brockman**: co-founder, president and board chair of OpenAI. Removed as chair and quit the same day as Altman's firing [S29][S31].

**Emmett Shear**: former CEO of Twitch. Interim CEO of OpenAI for about three days (named 19 November 2023) [S31].

**Helen Toner, Tasha McCauley, Adam D'Angelo**: the independent OpenAI board members in November 2023 [S31].
- Toner was a strategy director at Georgetown's Center for Security and Emerging Technology.
- D'Angelo was CEO of Quora. He stayed on the new board.
- In May 2024, Toner said Altman had withheld information from the board [S31] [VERIFIED-SECONDARY].

**Bret Taylor, Larry Summers**: the new initial OpenAI board from 21–22 November 2023, with Taylor as chair [S30].

**Satya Nadella**: CEO of Microsoft, Redmond, WA. He announced the January 2023 investment [S4] and mediated in November 2023 [S31].
- **Pictured:** medium build; shaved/bald head, short grey beard, rimless glasses; often a dark sweater or open-collared shirt [UNVERIFIED appearance].

**Sundar Pichai**: CEO of Google/Alphabet, Mountain View, CA. He announced Bard on 6 February 2023 [S6].
- **Pictured:** slim; short dark-grey hair; often a quarter-zip sweater on stage [UNVERIFIED appearance].

**Geoffrey Hinton**: University of Toronto and Google (Google Brain, Toronto) until 2023, then emeritus. 2018 Turing laureate; 2024 physics Nobel laureate.
- **Beliefs then:** in the NYT he said he had long thought smarter-than-human AI was "30 to 50 years or even longer away. Obviously, I no longer think that." [S23]. He told the BBC that digital models can share what they learn instantly, "as if you had 10,000 people and whenever one person learnt something, everybody automatically knew it" [S24].
- **He did not back the pause.** He said "I don't think we should stop developing this stuff" and that "China would just get a big lead" [S24]. He signed the CAIS statement as first-listed signatory [S26].
- **Pictured:** tall and lean; full head of white hair, swept back; usually no glasses in recent photos; sweaters or open-collared shirts and casual jackets. Famously often stands rather than sits, owing to a back problem [UNVERIFIED; check before use]. The NYT interview took place "in the dining room of his home in Toronto" [S23].

**Yann LeCun**: Chief AI Scientist at Meta (New York and Paris) and NYU professor. 2018 Turing laureate.
- **Beliefs:** the leading dissenter on existential risk ("preposterously ridiculous") [S28]. Favoured open research: the BBC reports, in its own words, that he said it would be "a huge mistake" to keep AI research "under lock and key" (only "under lock and key" is inside his quotation marks) [S28]. Believed there was "no question" machines would surpass human intelligence. The BBC paraphrases, without quotation marks, that this would take "years if not decades" and that chatbots like ChatGPT lack memory, reasoning, planning and common sense [S28]. *(Fact-check: "years if not decades" is BBC reported speech, not a LeCun quote.)*
- **Pictured:** stocky-medium build; grey hair; dark-rimmed glasses; often a dark jacket over a T-shirt or open shirt [UNVERIFIED appearance].

**Yoshua Bengio**: Université de Montréal and Mila, Montréal. 2018 Turing laureate.
- Signed the FLI pause letter [S21][S24], citing the "unexpected acceleration" in AI systems ("we need to take a step back") [S24]. Second signatory of the CAIS statement [S26].
- **Pictured:** grey, curly, somewhat tousled hair; strong dark eyebrows; often a sweater or casual shirt [UNVERIFIED appearance].

**Timnit Gebru, Emily M. Bender, Angelina McMillan-Major**: co-authors of the 2021 "Stochastic Parrots" paper and the bylined authors of the 31 March 2023 DAIR statement against the pause letter [S22]. **Margaret Mitchell** (then chief ethics scientist at Hugging Face), also a co-author of the paper, is not on the current DAIR byline. She criticised the letter separately to Reuters, saying it "asserts a set of priorities and a narrative on AI that benefits the supporters of FLI" [S22a]. Gebru founded DAIR (Distributed AI Research Institute). Bender is a University of Washington linguist, Seattle.
- **Beliefs:** the real harms are present (labour exploitation, data theft, synthetic media, concentration of power), and "longtermism" distracts from them [S22].

**Sébastien Bubeck**: Microsoft Research, Redmond. Lead author of "Sparks of AGI" [S17][S18].

**Peter Lee**: head of Microsoft Research. Initially sceptical of GPT-4, he said the experience "evolved into a sense of frustration, annoyance, maybe even fear" [S18].

**Maarten Sap** (Carnegie Mellon) and **Alison Gopnik** (UC Berkeley psychologist): critics of the "Sparks" framing quoted in the NYT [S18].

**Dario Amodei**: CEO of Anthropic, San Francisco. Previously VP of research at OpenAI. Signed the CAIS statement [S26].
- **Pictured:** curly dark hair, glasses; casual dress, often a plain T-shirt or sweater [UNVERIFIED appearance].

**Daniela Amodei**: president of Anthropic [S53].

**Chris Olah**: Anthropic co-founder who leads interpretability research. Corresponding author of "Towards Monosemanticity" [S48].

**Demis Hassabis**: CEO of Google DeepMind, London (King's Cross). 2024 chemistry Nobel laureate for AlphaFold. Signed the CAIS statement [S26][S42].
- **Pictured:** slight build; short dark close-cropped hair; often a dark suit or smart-casual jacket [UNVERIFIED appearance].

**John Jumper**: Google DeepMind, London. 2024 chemistry Nobel laureate (AlphaFold2) [S42].

**David Baker**: University of Washington, Seattle, and HHMI. 2024 chemistry Nobel laureate "for computational protein design" [S42].

**John J. Hopfield**: Princeton University. 2024 physics Nobel laureate, aged 91 at the award [S46].
- **Pictured:** elderly; white hair; often glasses [UNVERIFIED appearance].

**Ellen Moons**: Karlstad University. Chair of the Nobel Committee for Physics 2024 [S45][S46].

**Dame Wendy Hall**: University of Southampton computer scientist and UN AI adviser. Called the physics Nobel "a bit of a stretch" [S45].

**Joe Biden** (US President, signed EO 14110), **Rishi Sunak** (UK Prime Minister, host of Bletchley) [S33][S35]. Sunak as host is UNVERIFIED in this pass, though not in doubt.

---

## 4. The belief of the age

### What the field believed going into late 2022
- **Scaling works.** The working faith of OpenAI, Anthropic and DeepMind was that bigger transformer language models, trained on more text with more compute, improve predictably. The GPT-4 report states it openly. OpenAI "developed infrastructure and optimization methods that have very predictable behavior across multiple scales", allowing it to "reliably predict some aspects of the performance of GPT-4 from smaller models trained using 1,000× – 10,000× less compute" [S16] [VERIFIED-PRIMARY].
- **Chat was a product detail, not a breakthrough.** OpenAI called ChatGPT a "research preview" and said usage would be free "during the research preview" [S1]. Engineers did not expect the reaction [S2].
- **Incumbents believed they could wait.** The NYT reported that Google might be "reluctant to deploy this new tech as a replacement for online search" because chatbots are "not suited to delivering digital ads, which accounted for more than 80 percent of the company's revenue last year" [S5] [VERIFIED-SECONDARY].

### What changed in 2023: "how far away is human-level AI?"
- **Hinton's own reversal** is the clearest statement of the shift: "The idea that this stuff could actually get smarter than people — a few people believed that. But most people thought it was way off. And I thought it was way off. I thought it was 30 to 50 years or even longer away. Obviously, I no longer think that." [S23] [VERIFIED-SECONDARY].
- **Who held the "soon and dangerous" view:**
  - signatories of the CAIS statement: Hinton, Bengio, Hassabis, Altman, Dario Amodei and hundreds more [S26][S27];
  - the FLI letter's signers, among them Bengio, Stuart Russell, Elon Musk, Steve Wozniak and Yuval Noah Harari [S21];
  - Eliezer Yudkowsky, who said the pause letter "doesn't go far enough" [S21].
- **Who dissented, and on what grounds:**
  - **LeCun:** human-level AI is not imminent, and when it comes it will be engineered to be safe, like turbojets [S28].
  - **The AI-ethics camp** (Gebru, Bender, McMillan-Major in the DAIR statement; Mitchell separately): the letter's focus on imagined risks is "fearmongering and AI hype" that distracts from present harms [S22][S22a].
  - **Sap and Gopnik** on "Sparks": anthropomorphism and corporate PR [S18].
  - **Bill Gates** did not sign the pause letter. Wikipedia quotes him doubting that "asking one particular group to pause" would solve the challenges [S21].
- **How long it lasted:** the worry did not end in this era. It became institutional, through the UK summit, the US executive order and lab safety policies such as Anthropic's RSP. Hinton repeated it at his Nobel banquet in December 2024 [S44].
- **What ended the US federal approach:** EO 14110 was revoked on 20 January 2025 [S34]. That marks the end of this era's US policy register.

### The three-way split (the film can draw it as three lanterns)
| Camp | Core claim | Representative voices | Source |
|---|---|---|---|
| Existential risk / "AI safety" | Systems smarter than us may escape control; treat it like pandemics and nuclear war | Hinton, Bengio, CAIS, FLI, Yudkowsky | [S20][S23][S24][S26] |
| Present harms / "AI ethics" | Harms are "real and present": exploitation, synthetic media, concentration of power; doom talk is hype | Gebru, Bender, McMillan-Major (DAIR statement); Mitchell (separately) | [S22][S22a] |
| Sceptics of doom / open research | Fears are "preposterously ridiculous"; there will be an "off switch"; keep research open | LeCun | [S28] |

Note the overlap: Hinton worried about present harms too (misinformation, jobs, "bad actors") [S23][S24]. Present this as a spectrum, not three teams.

---

## 5. Experiments and results

### ChatGPT's training recipe (as OpenAI described it, 30 Nov 2022) [S1] [VERIFIED-PRIMARY]
1. **Supervised fine-tuning.** Human AI trainers wrote conversations, playing both user and assistant.
2. **Reward model.** Trainers ranked several model answers to the same prompt. These comparisons trained a reward model.
3. **Reinforcement learning.** OpenAI used Proximal Policy Optimization against the reward model ("We performed several iterations of this process").
- **Base model:** "a model in the GPT-3.5 series, which finished training in early 2022".
- **Hardware:** "an Azure AI supercomputing infrastructure".
- **Known limits, admitted at launch:** "ChatGPT sometimes writes plausible-sounding but incorrect or nonsensical answers."
- *For the art department:* there was no new machine. Picture a web page with a single text box, and behind it rows of anonymous data-centre racks under a Microsoft Azure contract. The novelty was a human ranking slips of paper ("which answer is better?") millions of times.

### GPT-4 (14 March 2023) [S16] [VERIFIED-PRIMARY]
- **A "large multimodal model"** that accepts image and text input and produces text output.
- **Exam results** (post-trained RLHF model):

| Exam | GPT-4 | GPT-3.5 |
|---|---|---|
| Uniform Bar Exam | 298/400 (~90th percentile) | 213/400 (~10th) |
| LSAT | 163 (~88th) | 149 (~40th) |
| SAT Math | 700/800 (~89th) | 590/800 (~70th) |
| GRE Verbal | 169/170 (~99th) | 154/170 (~63rd) |

- **Predictable scaling.** Performance was forecast from runs using 1,000×–10,000× less compute.
- **Secrecy.** No architecture, size, hardware, compute or data details were given, citing "the competitive landscape and the safety implications".
- **Contested bar figure.** Eric Martínez, "Re-evaluating GPT-4's bar exam performance", *Artificial Intelligence and Law* (published 30 March 2024), argued OpenAI's percentile estimates "are overinflated" [S19] [VERIFIED-PRIMARY, abstract via Crossref]:
  - The ~90th percentile came from conversions for February Illinois exams, "heavily skewed towards repeat test-takers who failed the July administration".
  - Against a July exam, GPT-4 was "below the 69th percentile" (~48th on essays).
  - Against first-time test takers, it was "~62nd percentile" (~42nd on essays).
  - Among those who passed, it was "~48th percentile overall" (~15th on essays).
  - The paper replicated the multiple-choice (MBE) score but questioned how the essay components were graded.
  - Present this as a **contested** figure: OpenAI's number versus Martínez's re-analysis.

### "Sparks of AGI" (22 March 2023) [S17][S18]
- **Who and how:** a Microsoft Research team probed an early version of GPT-4 *before* release with informal, novel tasks.
- **Examples:**
  - stacking "a book, nine eggs, a laptop, a bottle and a nail" in a stable way (the model suggested placing the eggs on the book and the laptop on top of the eggs) [S18];
  - drawing a unicorn in the TikZ graphics language [S18].
- **Claim:** "could reasonably be viewed as an early (yet still incomplete) version of an artificial general intelligence (AGI) system" [S17].
- **The authors' own caveat,** quoted by critic Maarten Sap: they "acknowledge in their paper's introduction that their approach is subjective and informal and may not satisfy the rigorous standards of scientific evaluation" [S18].

### LLaMA (24 February 2023) [S8][S10]
- **Sizes:** 7B, 13B, 33B and 65B parameters, trained on 1.4 trillion tokens from public data (CommonCrawl, GitHub, Wikipedia in 20 languages, Project Gutenberg, Books3, arXiv LaTeX and more).
- **Results:** Meta reported that the 13B model beat GPT-3 (175B) on most benchmarks, and that 65B was competitive with PaLM and Chinchilla [S10] [VERIFIED-SECONDARY].
- **Leak:** on 3 March 2023 a torrent link was posted on 4chan. A pull request that same day asked to add the magnet link to Meta's official GitHub README [S10] [VERIFIED-SECONDARY].

### Anthropic interpretability [VERIFIED-PRIMARY]
- **"Towards Monosemanticity" (4 Oct 2023)** [S48]
  - Model: a one-layer transformer with a 512-neuron MLP layer.
  - Method: sparse autoencoders trained on MLP activations from 8 billion data points, with expansion factors from 1× (512 features) to 256× (131,072 features). The detailed analysis focused on a 4,096-feature run.
  - The problem addressed is **polysemanticity**: single neurons that respond to unrelated things (the paper's examples include "HTTP requests, and Korean text"). The proposed cause is **superposition**: a network represents "more independent 'features' of the data than it has neurons".
- **"Scaling Monosemanticity" (21 May 2024)** [S49]
  - Applied the method to **Claude 3 Sonnet**, a production model. Three SAEs had ~1M (1,048,576), ~4M (4,194,304) and ~34M (33,554,432) features.
  - Named example: a "Golden Gate Bridge feature" (34M/31164353) whose strongest activations "are essentially all references to the bridge". Features "also activate on relevant images, despite our only performing dictionary learning on a text-based dataset!"
- **"Golden Gate Claude" (23 May 2024)** [S50]
  - Anthropic turned up that feature's activation. The resulting model was "online for a 24-hour period as a research demo".
  - *Visual:* a chatbot that steers every conversation back to a red suspension bridge in fog.

### Anthropic Responsible Scaling Policy (19 Sept 2023) [S47] [VERIFIED-PRIMARY]
"AI Safety Levels (ASL)... modeled loosely after the US government's biosafety level (BSL) standards for handling of dangerous biological materials."
- **ASL-1** = "systems which pose no meaningful catastrophic risk".
- **ASL-2** = early signs of dangerous capabilities, "for example ability to give instructions on how to build bioweapons – but where the information is not yet useful".
- **ASL-3** = systems that "substantially increase the risk of catastrophic misuse compared to non-AI baselines (e.g. search engines or textbooks) OR that show low-level autonomous capabilities".

### Policy "apparatus"
- **EO 14110** [S33] [VERIFIED-PRIMARY]
  - Reporting was required for "any model that was trained using a quantity of computing power greater than 10^26 integer or floating-point operations", or 10^23 for models trained primarily on biological sequence data.
  - It also covered computing clusters in a single datacentre with networking over 100 Gbit/s and a theoretical maximum of 10^20 operations per second for AI training.
- **EU AI Act** [S39] [VERIFIED-SECONDARY]
  - Four risk levels (unacceptable, high, limited, minimal) plus a general-purpose AI category.
  - General-purpose models trained with more than 10^25 FLOPs are presumed to pose "systemic risk".
  - Phase-in: bans at 6 months, general-purpose AI at 12 months, most rules at 24 months, some high-risk obligations at 36 months.
  - *Fact-check caution:* this is the schedule as adopted in 2024. Before the film states any post-2025 application date as current (as of 2026-10-05), check for later amendments. One lead to check is the Commission's late-2025 "digital omnibus" simplification proposal, reported to delay some high-risk obligations [UNVERIFIED lead; not retrieved in this pass].
- **China's Interim Measures** [S40] [VERIFIED-PRIMARY]
  - Issued by seven bodies: the Cyberspace Administration of China (CAC), National Development and Reform Commission, Ministry of Education, Ministry of Science and Technology, Ministry of Industry and Information Technology, Ministry of Public Security, and National Radio and Television Administration.
  - **24 articles.** Article 2 limits the scope to services offered "to the public within the territory of the PRC". Research and development not offered to the public is exempt.
  - Article 3 states the principle of giving "equal weight to development and security" (发展和安全并重).
  - Article 4 requires adherence to "core socialist values" (社会主义核心价值观) and forbids content that incites subversion of state power, among other things.
- **Bletchley Declaration** [S35]: a political declaration, not a treaty. 28 countries and the EU, listed alphabetically from Australia to the United States, including China.

---

## 6. Verified quotes

All quotes are verbatim from the retrieved text. "Retrieved" means read in this pass.

1. **OpenAI, ChatGPT launch post, 30 Nov 2022** [S1] (retrieved via Wayback Machine): "We've trained a model called ChatGPT which interacts in a conversational way. The dialogue format makes it possible for ChatGPT to answer followup questions, admit its mistakes, challenge incorrect premises, and reject inappropriate requests."
2. **OpenAI, same post** [S1]: "ChatGPT sometimes writes plausible-sounding but incorrect or nonsensical answers."
3. **Microsoft, 23 Jan 2023** [S4]: "Today, we are announcing the third phase of our long-term partnership with OpenAI through a multiyear, multibillion dollar investment to accelerate AI breakthroughs to ensure these benefits are broadly shared with the world." (Full sentence verified on retrieval in the fact-check pass.)
4. **GPT-4 Technical Report, Mar 2023** [S16]: "Given both the competitive landscape and the safety implications of large-scale models like GPT-4, this report contains no further details about the architecture (including model size), hardware, training compute, dataset construction, training method, or similar."
5. **Bubeck et al., "Sparks of AGI," 22 Mar 2023** [S17]: "Given the breadth and depth of GPT-4's capabilities, we believe that it could reasonably be viewed as an early (yet still incomplete) version of an artificial general intelligence (AGI) system."
6. **Maarten Sap (CMU), NYT, 16 May 2023** [S18]: "The 'Sparks of A.G.I.' is an example of some of these big companies co-opting the research paper format into P.R. pitches."
7. **Peter Lee (Microsoft Research), NYT, 16 May 2023** [S18]: "I started off being very skeptical — and that evolved into a sense of frustration, annoyance, maybe even fear."
8. **FLI open letter, dated 22 Mar 2023** [S20]: "we call on all AI labs to immediately pause for at least 6 months the training of AI systems more powerful than GPT-4." Also: "Should we let machines flood our information channels with propaganda and untruth?" and "Should we risk loss of control of our civilization?"
9. **DAIR statement, 31 Mar 2023 (byline: Gebru, Bender, McMillan-Major)** [S22]: on the letter's recommendations, "these are overshadowed by fearmongering and AI hype, which steers the discourse to the risks of imagined 'powerful digital minds' with 'human-competitive intelligence.'" (inner quotation marks changed to single quotes; the original uses double quotes) Also: "The harms from so-called AI are real and present and follow from the acts of people and corporations deploying automated systems." And: "Those hypothetical risks are the focus of a dangerous ideology called longtermism that ignores the actual harms resulting from the deployment of AI systems today."
10. **Geoffrey Hinton, NYT, 1 May 2023** [S23], from an interview "in the dining room of his home in Toronto" (retrieved via Wayback Machine): "I console myself with the normal excuse: If I hadn't done it, somebody else would have."
11. **Hinton, NYT, 1 May 2023** [S23]: "It is hard to see how you can prevent the bad actors from using it for bad things."
12. **Hinton, NYT, 1 May 2023** [S23]: "Look at how it was five years ago and how it is now. Take the difference and propagate it forwards. That's scary." (In the article the two halves sit either side of a "he said" attribution. Quote them as two sentences or with an ellipsis.)
13. **Hinton, NYT, 1 May 2023** [S23]: "I don't think they should scale this up more until they have understood whether they can control it."
14. **Hinton, NYT, 1 May 2023** [S23]: "The idea that this stuff could actually get smarter than people — a few people believed that. But most people thought it was way off. And I thought it was way off. I thought it was 30 to 50 years or even longer away. Obviously, I no longer think that." (A "he said" attribution splits it after "believed that.")
15. **Hinton, tweet, 1 May 2023** [S25] (wording as cited by Wikipedia; tweet not retrieved directly): "In the NYT today, Cade Metz implies that I left Google so that I could criticize Google. Actually, I left so that I could talk about the dangers of AI without considering how this impacts Google. Google has acted very responsibly." Some reproductions read "so that I can talk". Check the original tweet before on-screen use.
16. **Hinton, BBC, 2 May 2023** [S24]: "Right now, they're not more intelligent than us, as far as I can tell. But I think they soon may be."
17. **Hinton, BBC, 2 May 2023** [S24]: "So it's as if you had 10,000 people and whenever one person learnt something, everybody automatically knew it. And that's how these chatbots can know so much more than any one person."
18. **Hinton, BBC, 2 May 2023** [S24]: "Even if everybody in the US stopped developing it, China would just get a big lead."
19. **CAIS Statement on AI Risk, 30 May 2023** [S26] (complete text): "Mitigating the risk of extinction from AI should be a global priority alongside other societal-scale risks such as pandemics and nuclear war."
20. **Yann LeCun, Paris press event, reported by BBC (Chris Vallance) 14/15 Jun 2023** [S28]: "Will AI take over the world? No, this is a projection of human nature on machines". On the fear that scientists would "get to turn on a super-intelligent system that is going to take over the world within minutes": "That's you know just preposterously ridiculous." Also: "it's still going to run on a data centre somewhere with an off switch". (BBC prints "if you realise it's not safe you just don't built it" with the typo "built"; correct it with [sic] or paraphrase.)
21. **OpenAI board, 17 Nov 2023** (blog post, quoted by The Verge) [S29]: "Mr. Altman's departure follows a deliberative review process by the board, which concluded that he was not consistently candid in his communications with the board, hindering its ability to exercise its responsibilities. The board no longer has confidence in his ability to continue leading OpenAI."
22. **Bletchley Declaration, 1 Nov 2023** [S35]: "There is potential for serious, even catastrophic, harm, either deliberate or unintentional, stemming from the most significant capabilities of these AI models."
23. **Anthropic RSP, 19 Sep 2023** [S47]: the ASL system is "modeled loosely after the US government's biosafety level (BSL) standards for handling of dangerous biological materials."
24. **Nobel citation, Physics 2024** [S41]: "for foundational discoveries and inventions that enable machine learning with artificial neural networks".
25. **Nobel citation, Chemistry 2024** [S42]: David Baker "for computational protein design"; Demis Hassabis and John Jumper "for protein structure prediction".
26. **Hinton, Nobel telephone interview with Adam Smith, 8 Oct 2024** [S43]: "I'm in a cheap hotel in California, without an internet connection, and with a not very good phone line, phone connection. I was planning to get an MRI scan today, but I guess I'll have to cancel that." And: "My very first thought was how could I be sure it wasn't a spoof call."
27. **Hinton, press briefing, 8 Oct 2024 (Guardian)** [S45]: "I'm flabbergasted." And: "It will be comparable with the Industrial Revolution. But instead of exceeding people in physical strength, it's going to exceed people in the intellectual ability."
28. **Dame Wendy Hall, Guardian, 8 Oct 2024** [S45]: "There is no Nobel prize for computer science so this is an interesting way of creating one, but it does seem a bit of a stretch."
29. **Ellen Moons, Nobel Committee chair, 8 Oct 2024** (Physics World) [S46]: "This year's laureates used fundamental concepts from statistical physics to design artificial neural networks that function as associative memories and find patterns in large data sets."
30. **Hinton, Nobel banquet speech, 10 Dec 2024** [S44]: "There is also a longer term existential threat that will arise when we create digital beings that are more intelligent than ourselves. We have no idea whether we can stay in control." And the closing: "We urgently need research on how to prevent these new beings from wanting to take control. They are no longer science fiction."
31. **Hinton, NYT, 1 May 2023, on Oppenheimer** [S23]: the NYT reports that Hinton used to "paraphrase Robert Oppenheimer": "When you see something that is technically sweet, you go ahead and do it." **Context matters:** it is Hinton paraphrasing Oppenheimer, and the NYT adds "He does not say that anymore." Do not attribute it to Oppenheimer as a verbatim quote.

**UNVERIFIED — do not use as quotes:**
- Sam Altman's 5 Dec 2022 tweet about 1 million users ("ChatGPT launched on wednesday. today it crossed 1 million users!"). The fact is secondary-verified [S2]; the wording is not.
- Ilya Sutskever's 20 Nov 2023 apology ("I deeply regret my participation in the board's actions..."). Wikipedia confirms he apologised publicly [S31]; the wording was not retrieved.
- Any Altman "I loved my time at OpenAI" continuation beyond the fragment quoted by The Verge [S29].
- LeCun quotes about AI being less intelligent than a cat (e.g. from the FT, October 2023). Not retrieved.
- Any "Google code red" quote attributed to Pichai personally. The NYT says "Google's management" [S5], and Pichai later denied issuing it [S7].

---

## 7. Debates and controversies

1. **Was GPT-4 "sparks of AGI"?**
   - *For:* Bubeck et al. pointed to its breadth across maths, code, vision-in-text, medicine and law, and called it "an early (yet still incomplete)" AGI [S17]. Peter Lee went from scepticism to "maybe even fear" [S18].
   - *Against:* Sap called it "P.R. pitches", noting the authors' own admission that their method was "subjective and informal". Gopnik warned against anthropomorphism and "game show" comparisons. Ece Kamar (Microsoft) said "These behaviors are not always consistent" [S18].
   - Status: **contested**, then and now.
2. **Exam scores as evidence.** GPT-4's ~90th-percentile bar score [S16] was challenged as inflated by the choice of comparison population. Martínez estimated ~62nd percentile against first-time takers [S19]. Status: **contested**.
3. **Pause or not?**
   - *For a pause:* FLI letter signers [S20][S21].
   - *Against the premise:* the DAIR authors said its useful recommendations were "overshadowed by fearmongering and AI hype" [S22].
   - *Against as impractical:* Hinton, despite his fears: "China would just get a big lead" [S24]. Gates doubted pausing one group helps [S21].
   - *Too weak:* Yudkowsky said the letter "doesn't go far enough" [S21].
   - No major lab paused.
4. **"AI ethics" vs "AI safety."** These are present, documented harms (bias, labour, synthetic media, concentration of power) against speculative catastrophic or extinction risk [S22][S26]. Some people sit in both camps: Hinton named "bad actors" and job loss as well as takeover [S23][S24]. Present it without sneering at either side.
5. **Existential risk: real or "preposterous"?**
   - Hinton, Bengio, Hassabis, Altman and Amodei signed the CAIS statement [S26].
   - LeCun called takeover scenarios "preposterously ridiculous" [S28].
   - The three 2018 Turing laureates split two against one: Hinton and Bengio worried, LeCun not [S24][S28].
6. **Open vs closed models.**
   - The LLaMA leak sparked debate. Some blamed Meta for distributing the model; others said "greater access will improve AI safety" [S9].
   - LeCun argued against keeping research "under lock and key" [S28].
   - OpenAI's GPT-4 report withheld all architecture details for "competitive" and "safety" reasons [S16].
7. **Why was Altman fired?**
   - The board's only public reason was "not consistently candid" [S29].
   - Reporting cited concerns over safety, commercialisation and candour [S31]. Speculation about a "Q*" breakthrough circulated on 22 Nov 2023 but was never confirmed as the reason [S31]. Treat Q* as **rumour**.
   - Toner later said Altman had withheld information from the board [S31].
   - The WilmerHale review (March 2024) found his conduct "did not mandate removal" [S31].
   - Present both, attribute each claim, and do not adjudicate.
8. **Was the 2024 physics Nobel "physics"?**
   - *For:* Ellen Moons said the laureates "used fundamental concepts from statistical physics" (the Hopfield network's energy function, and the Boltzmann machine, which borrows Boltzmann's distribution) [S46]. Michael Wooldridge (Oxford) called it "an indicator of just how much AI is transforming science" [S45].
   - *Against or sceptical:* Wendy Hall called it "a bit of a stretch… is it fair to say that in themselves they are the result of physics research?" [S45].
   - Hinton himself said he had "no idea I'd even been nominated for the Nobel Prize in Physics" [S43].
9. **Lab funding and independence.** Microsoft–OpenAI [S4], and Amazon– and Google–Anthropic [S51–S53]. These are cloud-for-equity relationships between big tech and labs that describe themselves as safety-focused. Report the amounts and terms; do not editorialise. Anthropic's earlier $500M from FTX [S53] is a factual footnote, and Anthropic was not implicated in FTX's fraud. If it is used, state that neutrally and source it.
10. **Regulatory philosophies.** The US used an executive order with compute thresholds, later revoked [S33][S34]. The EU passed a risk-tiered statute [S39]. China issued administrative measures centred on content and "core socialist values", stating "equal weight to development and security" [S40]. The UK convened a multilateral declaration that China signed [S35]. Present them side by side. None is a caricature.

---

## 8. Misconceptions to avoid

- **"ChatGPT was a new kind of AI."** It was a GPT-3.5 transformer fine-tuned with human feedback, "a sibling model to InstructGPT" [S1]. The novelty was the interface, free access and RLHF polish.
- **"ChatGPT had 100 million users, says OpenAI."** That was a UBS estimate from Similarweb traffic data [S2][S3]. Say "an analyst estimate".
- **"ChatGPT is still the fastest-growing app ever."** Meta's Threads surpassed that record in July 2023 [S2].
- **"Hinton quit Google to criticise Google."** He explicitly denied this: "Google has acted very responsibly" [S25][S24].
- **"Hinton signed the pause letter."** No source retrieved shows that. He told the BBC "I don't think we should stop developing this stuff" [S24]. Bengio did sign [S24].
- **"Hinton regrets his life's work"** (stated flatly). The NYT wrote "A part of him, he said, now regrets his life's work," and quoted him: "I console myself with the normal excuse…" [S23]. Keep that nuance.
- **"The pause letter had 30,000+ AI researcher signatures."** The 30,000+ count (31,810 on the FLI page as retrieved) includes anyone who signed online [S20][S21]. The NYT said "more than 1,000 technology leaders and researchers" at the time [S23].
- **"The CAIS statement said AI will cause extinction."** It said mitigating the *risk* should be a global *priority* [S26].
- **"Bard flubbed the telescope question live on stage in Paris."** The error was in a promotional GIF Google posted on Twitter (the same JWST example appeared in Pichai's 6 Feb blog post); Reuters reported it on 8 Feb, the day of the Paris event [S7a][S6].
- **"Pichai declared code red."** The NYT said "Google's management", and Pichai later denied issuing it [S5][S7].
- **"The board fired Altman over Q*."** Unconfirmed rumour [S31].
- **"Altman was gone for a week."** About four to five days: fired Friday 17 Nov, agreement late Tuesday 21 Nov (Pacific) [S29][S30].
- **"EO 14110 is US AI law."** It was an executive order, revoked 20 Jan 2025 [S34].
- **"The EU AI Act took effect in 2024."** It *entered into force* on 1 Aug 2024 but applies in phases from Feb 2025 to 2027 [S37][S39].
- **"China refused to join Western AI safety talks."** China signed the Bletchley Declaration [S35].
- **"Hopfield and Hinton invented deep learning / ChatGPT."** The prize was for associative-memory networks (Hopfield) and the Boltzmann machine and related work (Hinton) that "enable machine learning" [S41]. It was not for transformers or LLMs.
- **"Hassabis won the Nobel for AlphaGo / LLMs."** It was for AlphaFold (protein structure prediction), shared with Jumper [S42].
- **"GPT-4 and Claude launched on different days."** Both were announced on 14 March 2023 [S11][S16]. This is a fun fact, not a misconception, but get it right.
- **"Golden Gate Claude was a product."** It was a 24-hour research demo [S50].

---

## 9. Curiosity hooks

1. **ChatGPT was meant as a quiet research preview.** OpenAI's launch post said usage was free "during the research preview" [S1], and engineers said they had not expected it to be very successful [S2]. It reached an estimated 100 million monthly users in about two months [S2][S3].
2. **GPT-4 and Claude were announced on the same day**, 14 March 2023 [S11][S16].
3. **Meta's research-only LLaMA leaked within about a week.** A torrent link appeared on 4chan on 3 March 2023, and someone even opened a pull request to add the magnet link to Meta's official GitHub page [S9][S10].
4. **Microsoft's "Sparks" team tested GPT-4 with a balancing puzzle:** a book, nine eggs, a laptop, a bottle and a nail. It proposed laying the eggs on the book and the laptop on the eggs "with the screen facing down and the keyboard facing up" [S18].
5. **Hinton told the BBC the danger came partly from digital immortality and sharing.** Copies of a model can share what they learn instantly, "as if you had 10,000 people and whenever one person learnt something, everybody automatically knew it" [S24].
6. **Hinton learned of his Nobel at about 2 a.m. in "a cheap hotel in California"**, with no internet and a bad phone line. He had planned to get an MRI scan that day, and his first thought was that it might be "a spoof call" [S43].
7. **Two of the three "godfathers of deep learning" signed the extinction-risk statement; the third called the fear "preposterously ridiculous"** [S26][S28].
8. **China and the United States signed the same AI-safety declaration** at Bletchley Park, where wartime codebreakers had worked [S35].
9. **Anthropic found a single "Golden Gate Bridge" feature inside Claude 3 Sonnet** that also fired on *pictures* of the bridge, although it was found using text alone. Turning it up produced a chatbot obsessed with the bridge, live for 24 hours [S49][S50].
10. **EO 14110's reporting line was a number: 10^26 operations** [S33]. It was one of the first times a government drew a legal threshold in raw compute.

---

## 10. Visual and dramatic details

- **The chat box (30 Nov 2022).** A blank white page with a single input line at chat.openai.com, early winter. The blog post's header: "ChatGPT: Optimizing Language Models for Dialogue … 13 minute read" [S1]. Silhouette idea: one glowing rectangle in a dark room, with millions of tiny lit windows appearing around it.
- **Google's "fire alarm."** The NYT framed the code red as "akin to pulling the fire alarm" [S5]. Silhouette idea: a vast campus with a single alarm bell.
- **Paris, 8 Feb 2023.** The Bard event. A telescope (the JWST) silhouette, a small looping ad on a phone screen (the error was in a promotional GIF, not the live demo), and a stock ticker falling off a cliff [S7a].
- **4chan torrent.** A file icon splitting into thousands of seeds drifting across the internet [S9].
- **Hinton's dining room in Toronto.** The NYT interview took place there, "a short walk from where he and his students made their breakthrough" in 2012 [S23]. That is a strong callback to the AlexNet chapter: same city, same man, a decade later. Photo credit in the NYT was Chloe Ellingson [S23]. Do not copy the photo; use it only for reference.
- **Bletchley Park, 1–2 Nov 2023.** The Victorian mansion and codebreakers' huts in Buckinghamshire, in November. The irony of an AI summit at the home of wartime codebreaking (Turing worked there) is a natural visual rhyme. That Turing worked at Bletchley is well established; venue details are UNVERIFIED for specific rooms used.
- **OpenAI board crisis.** Reportedly Altman was told on a Google Meet video call "while watching the Las Vegas Grand Prix" [S31] (VERIFIED-SECONDARY; reported, not officially confirmed). Night race, neon city, a laptop in a hotel. Five days rendered as a five-panel paper-cut strip: Friday call; Saturday negotiations; Sunday new CEO; Monday the staff letter and Microsoft; Tuesday night the return.
- **The staff letter.** 745 of 770 names [S31]. Visual: a scroll lengthening name by name.
- **Data centres.** "Azure AI supercomputing infrastructure" [S1]; AWS Trainium and Inferentia chips for Anthropic [S51]. Endless aisles of racks; cold-aisle blue light.
- **The Nobel night.** Stockholm, 10 December 2024, the banquet. Hinton's speech opens "Your Majesties Your Royal Highnesses, Excellences, Dear Laureates, Ladies and Gentlemen" and closes "They are no longer science fiction." [S44].
- **Golden Gate Bridge in fog.** A literal and gorgeous silhouette for interpretability: a single neuron-lantern lighting up the bridge inside a dark cathedral of features [S49][S50].
- **Proteins.** AlphaFold predicted structures for "virtually all the 200 million proteins that researchers have identified", used by "more than two million people from 190 countries" [S42]. Paper-cut ribbons folding.
- **Period details (2023):** laptops with stickers, AirPods, hoodies and Patagonia vests (tech uniform); congressional hearing rooms with wood panelling; Paris press room for LeCun. Keep generic. Do not show real logos or branding.

---

## 11. Sources

- [S1] OpenAI, "ChatGPT: Optimizing Language Models for Dialogue," 30 Nov 2022. Current URL https://openai.com/index/chatgpt/ (returned 403 to automated fetch); archived copy read: https://web.archive.org/web/2022113023/https://openai.com/blog/chatgpt/
- [S2] Wikipedia, "ChatGPT" (retrieved 5 Oct 2026; cites Reuters UBS note and launch-week reports): https://en.wikipedia.org/wiki/ChatGPT
- [S3] Reuters, "ChatGPT sets record for fastest-growing user base – analyst note," 1–2 Feb 2023: https://www.reuters.com/technology/chatgpt-sets-record-fastest-growing-user-base-analyst-note-2023-02-01/ (retrieved in the fact-check pass via https://web.archive.org/web/20230203000000id_/https://www.reuters.com/technology/chatgpt-sets-record-fastest-growing-user-base-analyst-note-2023-02-01/ ; byline Krystal Hu)
- [S4] Microsoft Corporate Blogs, "Microsoft and OpenAI extend partnership," 23 Jan 2023: https://blogs.microsoft.com/blog/2023/01/23/microsoftandopenaiextendpartnership/
- [S5] Nico Grant and Cade Metz, "A New Chat Bot Is a 'Code Red' for Google's Search Business," New York Times, 21 Dec 2022: https://www.nytimes.com/2022/12/21/technology/ai-chatgpt-google-search.html (read via https://web.archive.org/web/20221222id_/https://www.nytimes.com/2022/12/21/technology/ai-chatgpt-google-search.html). Authors Nico Grant and Cade Metz verified in the fact-check pass.
- [S6] Sundar Pichai, "An important next step on our AI journey," Google blog, 6 Feb 2023: https://blog.google/technology/ai/bard-google-ai-search-updates/
- [S7] Wikipedia, "Google Gemini" (formerly "Gemini (chatbot)"; Bard history, code red, renaming): https://en.wikipedia.org/wiki/Google_Gemini . NB: its line that the JWST error happened "during the demo" is contradicted by its own Reuters source [S7a].
- [S7a] Martin Coulter and Greg Bensinger, "Alphabet shares dive after Google AI chatbot Bard flubs answer in ad," Reuters, 8 Feb 2023: https://www.reuters.com/technology/google-ai-chatbot-bard-offers-inaccurate-information-company-ad-2023-02-08/ (read via https://web.archive.org/web/20230209000000id_/https://www.reuters.com/technology/google-ai-chatbot-bard-offers-inaccurate-information-company-ad-2023-02-08/)
- [S8] Meta AI, "Introducing LLaMA: A foundational, 65-billion-parameter large language model," 24 Feb 2023: https://ai.meta.com/blog/large-language-model-llama-meta-ai/ (not retrievable as text in this pass; facts via [S10])
- [S9] James Vincent, "Meta's powerful AI language model has leaked online — what happens now?", The Verge, 8 Mar 2023: https://www.theverge.com/2023/3/8/23629362/meta-ai-language-model-llama-leak-online-misuse
- [S10] Wikipedia, "Llama (language model)": https://en.wikipedia.org/wiki/Llama_(language_model)
- [S11] Anthropic, "Introducing Claude," 14 Mar 2023: https://www.anthropic.com/news/introducing-claude
- [S12] Anthropic, "Claude 2," 11 Jul 2023: https://www.anthropic.com/news/claude-2
- [S13] Anthropic, "Introducing the next generation of Claude" (Claude 3 family), 4 Mar 2024: https://www.anthropic.com/news/claude-3-family
- [S14] Anthropic, "Claude 3.5 Sonnet," page dated 21 Jun 2024: https://www.anthropic.com/news/claude-3-5-sonnet
- [S15] Anthropic, "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku," 22 Oct 2024: https://www.anthropic.com/news/3-5-models-and-computer-use
- [S16] OpenAI, "GPT-4 Technical Report," arXiv:2303.08774 (v1 15 Mar 2023): https://arxiv.org/abs/2303.08774 ; PDF read: https://arxiv.org/pdf/2303.08774v1
- [S17] S. Bubeck et al., "Sparks of Artificial General Intelligence: Early experiments with GPT-4," arXiv:2303.12712, 22 Mar 2023: https://arxiv.org/abs/2303.12712
- [S18] Cade Metz, "Microsoft Says New A.I. Shows Signs of Human Reasoning," New York Times, 16 May 2023: https://www.nytimes.com/2023/05/16/technology/microsoft-ai-human-reasoning.html (read via https://web.archive.org/web/20230517id_/https://www.nytimes.com/2023/05/16/technology/microsoft-ai-human-reasoning.html). Headline and quotes verified in the fact-check pass.
- [S19] E. Martínez, "Re-evaluating GPT-4's bar exam performance," Artificial Intelligence and Law, published 30 Mar 2024, doi:10.1007/s10506-024-09396-9: https://link.springer.com/article/10.1007/s10506-024-09396-9 (abstract read via https://api.crossref.org/works/10.1007/s10506-024-09396-9)
- [S20] Future of Life Institute, "Pause Giant AI Experiments: An Open Letter," dated 22 Mar 2023: https://futureoflife.org/open-letter/pause-giant-ai-experiments/
- [S21] Wikipedia, "Pause Giant AI Experiments: An Open Letter": https://en.wikipedia.org/wiki/Pause_Giant_AI_Experiments:_An_Open_Letter
- [S22] T. Gebru, E. M. Bender, A. McMillan-Major (byline as shown on the page), "Statement from the listed authors of Stochastic Parrots on the 'AI pause' letter," DAIR, 31 Mar 2023: https://www.dair-institute.org/blog/letter-statement-March2023/
- [S22a] Kari Paul, "Letter signed by Elon Musk demanding AI research pause sparks controversy," The Guardian, 31 Mar 2023 (Mitchell's comments to Reuters): https://www.theguardian.com/technology/2023/mar/31/ai-research-pause-elon-musk-chatgpt
- [S23] Cade Metz, "'The Godfather of A.I.' Leaves Google and Warns of Danger Ahead," New York Times, 1 May 2023: https://www.nytimes.com/2023/05/01/technology/ai-google-chatbot-engineer-quits-hinton.html (read via https://web.archive.org/web/20230501id_/https://www.nytimes.com/2023/05/01/technology/ai-google-chatbot-engineer-quits-hinton.html). Headline and body text verified in the fact-check pass.
- [S24] Zoe Kleinman and Chris Vallance, "AI 'godfather' Geoffrey Hinton warns of dangers as he quits Google," BBC News, 2 May 2023: https://www.bbc.com/news/world-us-canada-65452940
- [S25] Wikipedia, "Geoffrey Hinton" (citation of Hinton's 1 May 2023 tweet): https://en.wikipedia.org/wiki/Geoffrey_Hinton
- [S26] Center for AI Safety, "Statement on AI Risk," 30 May 2023: https://www.safe.ai/work/statement-on-ai-risk and https://aistatement.com/
- [S27] Wikipedia, "Statement on AI risk of extinction": https://en.wikipedia.org/wiki/Statement_on_AI_risk_of_extinction
- [S28] BBC News, "Meta scientist Yann LeCun says AI won't destroy jobs forever," 15 Jun 2023: https://www.bbc.com/news/technology-65886125
- [S29] Jay Peters and Alex Heath, "Sam Altman fired as CEO of OpenAI," The Verge, 17 Nov 2023: https://www.theverge.com/2023/11/17/23965982/openai-ceo-sam-altman-fired
- [S30] The Verge, "Sam Altman to return as CEO of OpenAI," 22 Nov 2023: https://www.theverge.com/2023/11/22/23967223/sam-altman-returns-ceo-open-ai
- [S31] Wikipedia, "Removal of Sam Altman from OpenAI": https://en.wikipedia.org/wiki/Removal_of_Sam_Altman_from_OpenAI
- [S32] OpenAI, "OpenAI announces leadership transition," 17 Nov 2023: https://openai.com/index/openai-announces-leadership-transition/ (403 to automated fetch; text verified via [S29])
- [S33] Executive Order 14110, "Safe, Secure, and Trustworthy Development and Use of Artificial Intelligence," 30 Oct 2023, Federal Register 1 Nov 2023: https://www.federalregister.gov/documents/2023/11/01/2023-24283/safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence
- [S34] Executive Order 14148, "Initial Rescissions of Harmful Executive Orders and Actions," 20 Jan 2025: https://www.federalregister.gov/documents/2025/01/28/2025-01901/initial-rescissions-of-harmful-executive-orders-and-actions
- [S35] UK Government, "The Bletchley Declaration by Countries Attending the AI Safety Summit, 1-2 November 2023": https://www.gov.uk/government/publications/ai-safety-summit-2023-the-bletchley-declaration/the-bletchley-declaration-by-countries-attending-the-ai-safety-summit-1-2-november-2023
- [S36] European Parliament press release, "Artificial Intelligence Act: MEPs adopt landmark law," 13 Mar 2024: https://www.europarl.europa.eu/news/en/press-room/20240308IPR19015/artificial-intelligence-act-meps-adopt-landmark-law
- [S37] European Commission, "AI Act enters into force," 1 Aug 2024: https://commission.europa.eu/news-and-media/news/ai-act-enters-force-2024-08-01_en
- [S38] Regulation (EU) 2024/1689 (AI Act), EUR-Lex: https://eur-lex.europa.eu/eli/reg/2024/1689/oj (not retrievable as text in this pass)
- [S39] Wikipedia, "Artificial Intelligence Act": https://en.wikipedia.org/wiki/Artificial_Intelligence_Act
- [S40] Cyberspace Administration of China et al., 《生成式人工智能服务管理暂行办法》 (Interim Measures for the Management of Generative Artificial Intelligence Services), Order No. 15, published 13 Jul 2023: https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm
- [S41] NobelPrize.org, press release, Nobel Prize in Physics 2024, 8 Oct 2024: https://www.nobelprize.org/prizes/physics/2024/press-release/
- [S42] NobelPrize.org, press release, Nobel Prize in Chemistry 2024, 9 Oct 2024: https://www.nobelprize.org/prizes/chemistry/2024/press-release/
- [S43] NobelPrize.org, Geoffrey Hinton telephone interview (Adam Smith), Oct 2024: https://www.nobelprize.org/prizes/physics/2024/hinton/interview/
- [S44] NobelPrize.org, Geoffrey Hinton banquet speech, 10 Dec 2024: https://www.nobelprize.org/prizes/physics/2024/hinton/speech/
- [S45] The Guardian, "Machine learning pioneers win Nobel prize in physics," 8 Oct 2024: https://www.theguardian.com/science/2024/oct/08/nobel-prize-physics-john-hopfield-geoffrey-hinton-machine-learning
- [S46] Physics World, "John Hopfield and Geoffrey Hinton share the 2024 Nobel Prize for Physics," 8 Oct 2024: https://physicsworld.com/a/john-hopfield-and-geoffrey-hinton-share-the-2024-nobel-prize-for-physics/
- [S47] Anthropic, "Anthropic's Responsible Scaling Policy," 19 Sep 2023: https://www.anthropic.com/news/anthropics-responsible-scaling-policy
- [S48] Bricken, Templeton et al. (Anthropic), "Towards Monosemanticity: Decomposing Language Models With Dictionary Learning," 4 Oct 2023: https://transformer-circuits.pub/2023/monosemantic-features/index.html
- [S49] Templeton, Conerly et al. (Anthropic), "Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet," 21 May 2024: https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html
- [S50] Anthropic, "Golden Gate Claude," 23 May 2024: https://www.anthropic.com/news/golden-gate-claude
- [S51] Anthropic, "Expanding access to safer AI with Amazon," 25 Sep 2023: https://www.anthropic.com/news/anthropic-amazon
- [S52] Amazon, "Amazon concludes $4 billion investment in Anthropic" (March 2024): https://www.aboutamazon.com/news/company-news/amazon-anthropic-ai-investment
- [S53] Wikipedia, "Anthropic" (founding, FTX funding): https://en.wikipedia.org/wiki/Anthropic
- [S53a] Krystal Hu, "Google agrees to invest up to $2 billion in OpenAI rival Anthropic," Reuters, 27 Oct 2023: https://www.reuters.com/technology/google-agrees-invest-up-2-bln-openai-rival-anthropic-wsj-2023-10-27/ (read via https://web.archive.org/web/20231102122701id_/https://www.reuters.com/technology/google-agrees-invest-up-2-bln-openai-rival-anthropic-wsj-2023-10-27/)
- [S54] Anthropic, "Powering the next generation of AI development with AWS," 22 Nov 2024: https://www.anthropic.com/news/anthropic-amazon-trainium

---

## 12. Fact-check log (adversarial pass, 2026-10-05)

Method: the 20 key claims and every quote in section 6 were re-checked against sources opened in this pass. Sources were retrieved directly where possible, via Wayback `id_` captures for NYT and Reuters, via the Federal Register API, via Crossref, or as Wikipedia raw wikitext. The dossier's own citations were not trusted. Web-search budget was exhausted, so every check used direct retrieval.

### Corrections made
1. **Bard's JWST error: venue was wrong.** The draft said Bard gave the wrong fact "at its Paris demonstration". The error was actually in a **promotional GIF video Google posted on Twitter**; the same JWST example also appears in Pichai's 6 Feb blog post. Reuters reported it on 8 Feb, the day of the Paris event. Per Reuters, Alphabet "lost $100 billion in market value ... after its new chatbot shared inaccurate information in a promotional video and a company event failed to dazzle". Fixed in the summary, timeline, misconceptions and visual notes. Sources: Reuters 8 Feb 2023 (Coulter & Bensinger) https://web.archive.org/web/20230209000000id_/https://www.reuters.com/technology/google-ai-chatbot-bard-offers-inaccurate-information-company-ad-2023-02-08/ ; Google blog 6 Feb 2023 https://blog.google/technology/ai/bard-google-ai-search-updates/ . Wikipedia's "Google Gemini" says "during the demo", which contradicts its own Reuters citation.
2. **GPT-4 table: GPT-3.5 GRE Verbal.** The draft had "—". The report gives 154/170 (~63rd). Source: arXiv:2303.08774v1 Table 1, https://arxiv.org/pdf/2303.08774v1
3. **Martínez bar-exam critique** moved from UNVERIFIED to VERIFIED, with figures:
   - ~62nd percentile against first-time takers;
   - below the 69th against a July exam;
   - ~48th among those who passed;
   - published 30 Mar 2024.
   Source: https://api.crossref.org/works/10.1007/s10506-024-09396-9 . Marked **contested**.
4. **DAIR statement authorship.** The draft named four authors including Margaret Mitchell. The DAIR page byline names three: Gebru, Bender and McMillan-Major. Mitchell criticised the letter separately to Reuters. Sources: https://www.dair-institute.org/blog/letter-statement-March2023/ ; https://www.theguardian.com/technology/2023/mar/31/ai-research-pause-elon-musk-chatgpt
5. **DAIR wording.** The draft said the letter "fed" or "fuelled" "fearmongering and AI hype". The actual sentence says the letter's worthwhile recommendations "are overshadowed by fearmongering and AI hype". The phrase itself is verbatim; the verb was a paraphrase. Reframed. Same source as 4.
6. **Google–Anthropic investment attribution.** The draft said "Reuters (citing WSJ)". Reuters attributed the $500M upfront plus $1.5B over time to "a spokesperson for the startup", i.e. Anthropic. Source: https://web.archive.org/web/20231102122701id_/https://www.reuters.com/technology/google-agrees-invest-up-2-bln-openai-rival-anthropic-wsj-2023-10-27/
7. **LeCun "years if not decades".** The draft presented this as a LeCun quote. It is BBC reported speech without quotation marks. Of "a huge mistake to keep AI research 'under lock and key'", only "under lock and key" is inside quotation marks. Source: https://www.bbc.com/news/technology-65886125
8. **Anthropic founding.** Wikipedia's body says "founded in January 2021 by seven former employees of OpenAI", but its infobox lists eight founders. 26 Jan 2021 is an incorporation date from a business registry. Advice: avoid a founder count. Source: https://en.wikipedia.org/wiki/Anthropic

### Marked contested
- **Mira Murati's role.** Wikipedia now states the removal "was predicated by employee concerns, led by co-founder Ilya Sutskever and chief technology officer Mira Murati". This comes from later reporting, not the November 2023 record. Attribute it; do not assert it. Source: https://en.wikipedia.org/wiki/Removal_of_Sam_Altman_from_OpenAI
- **GPT-4's ~90th-percentile bar score.** OpenAI's figure versus Martínez's re-analysis (see correction 3).

### Upgrades: previously caveated, now verified
- **Microsoft 23 Jan 2023 sentence.** Full text including "with the world" verified: https://blogs.microsoft.com/blog/2023/01/23/microsoftandopenaiextendpartnership/
- **NYT bylines and headlines.**
  - Code red: Nico Grant and Cade Metz.
  - Hinton: "'The Godfather of A.I.' Leaves Google and Warns of Danger Ahead".
  - Sparks: "Microsoft Says New A.I. Shows Signs of Human Reasoning".
  - All read via Wayback `id_` captures.
- **Reuters UBS/Similarweb 100M note** (Krystal Hu, 1 Feb 2023) retrieved directly.
- **Amazon's $2.75bn.** Dated 27 Mar 2024 (aboutamazon.com datePublished).
- **Amazon's further $4bn.** Dated 22 Nov 2024: https://www.anthropic.com/news/anthropic-amazon-trainium

### Confirmed as written (key claims 1–20, abridged)
1. **ChatGPT launch post** (Wayback copy). Confirmed: 30 Nov 2022; "sibling model to InstructGPT"; "fine-tuned from a model in the GPT-3.5 series, which finished training in early 2022"; PPO; "ChatGPT and GPT 3.5 were trained on an Azure AI supercomputing infrastructure"; free "During the research preview".
2. **User numbers.** 1M users in five days (secondary, via Wikipedia); 100M MAU as a UBS estimate (Reuters).
3. **Microsoft.** "multiyear, multibillion dollar investment"; $10bn was not stated by Microsoft.
4. **Google.** NYT 21 Dec 2022 "code red" ("led Google's management to declare a 'code red'"); Bard blog 6 Feb 2023; Bard opened 21 Mar 2023; renamed Gemini 8 Feb 2024.
5. **LLaMA.** Announced 24 Feb 2023; 1.4T tokens; leaked via 4chan on 3 Mar 2023; pull request opened the same day (Wikipedia; The Verge 8 Mar 2023).
6. **GPT-4 and Claude.** Both announced 14 Mar 2023 (Anthropic page dated Mar 14, 2023). GPT-4: UBE 298/400 (~90th) versus 213/400 (~10th); the "no further details..." sentence; "1,000× – 10,000× less compute".
7. **Sparks.** arXiv v1 22 Mar 2023; AGI sentence verbatim; Sap, Lee, Kamar and Gopnik quotes verbatim (NYT 16 May 2023).
8. **FLI letter.** Page shows "Published 22 March, 2023" and 31,810 signatures; pause sentence verbatim. DAIR statement dated 31 Mar 2023; "Tuesday March 28" publication verbatim.
9. **Hinton, NYT and BBC.** NYT quotes all verbatim (console myself; bad actors; five years ago; scale this up; 30 to 50 years; Oppenheimer paraphrase; dining room). BBC 2 May 2023 (Kleinman & Vallance): "Right now...", "10,000 people", "I don't think we should stop developing this stuff", "China would just get a big lead". Bengio: "unexpected acceleration" and "we need to take a step back". The tweet wording matches the cite-tweet text on Wikipedia (secondary).
10. **CAIS statement.** Full text verbatim; Hinton, Bengio, Hassabis, Altman and Dario Amodei listed, Hinton first.
11. **LeCun, BBC.** "Will AI take over the world? No, this is a projection of human nature on machines"; "take over the world within minutes"; "That's you know just preposterously ridiculous."; "off switch"; "don't built it" [sic]; the turbo-jet analogy.
12. **Altman crisis.** Board statement verbatim (The Verge, 17 Nov 2023). The rest via Wikipedia and The Verge: Shear named 19 Nov; 745/770 letter and Microsoft hire on 20 Nov; "agreement in principle" "late Tuesday" with Taylor, Summers and D'Angelo; Las Vegas Grand Prix / Google Meet; WilmerHale "did not mandate removal".
13. **EO 14110.** Federal Register: signed 2023-10-30; >10^26 operations; 10^23 for biological-sequence models; clusters over 100 Gbit/s with 10^20 ops/s. EO 14148 (signed 2025-01-20) lists EO 14110 among revoked orders.
14. **Bletchley Declaration.** GOV.UK: "potential for serious, even catastrophic, harm" verbatim; 28 countries plus the EU, including China and the USA.
15. **EU AI Act.** EP: 523–46–49 on 13 Mar 2024. EC: in force 1 Aug 2024. Wikipedia: Council 21 May 2024; OJ 12 Jul 2024; bans at 6 months.
16. **China's Interim Measures** (CAC page). Seven agencies, Order No. 15; adopted 23 May 2023; signed 10 Jul 2023; published 13 Jul 2023; in force 15 Aug 2023. 24 articles (Art. 24 is the commencement clause); Art. 3 发展和安全并重; Art. 4(1) 社会主义核心价值观.
17. **Nobels** (NobelPrize.org). Both citations verbatim. AlphaFold "200 million proteins" and "two million people from 190 countries". Hinton phone interview verbatim ("cheap hotel", MRI, "spoof call", "no idea I'd even been nominated"). Banquet speech quotes verbatim. Guardian: Hinton "flabbergasted"; Industrial Revolution quote; Wendy Hall "a bit of a stretch"; Wooldridge. Physics World: Moons quote; Hopfield 91.
18. **Anthropic dates and RSP.** RSP 19 Sep 2023, "modeled loosely after" BSL; ASL-1/2/3 definitions verbatim. Claude 2: 11 Jul 2023. Claude 3: 4 Mar 2024. Claude 3.5 Sonnet page dated Jun 21, 2024. Computer use: 22 Oct 2024.
19. **Interpretability.** Towards Monosemanticity (Published Oct 4, 2023): 512-neuron MLP, 8 billion data points, 1×–256×, 4,096-feature run A/1, "HTTP requests, and Korean text". Scaling Monosemanticity (Published May 21, 2024): 1,048,576 / 4,194,304 / 33,554,432 features; Golden Gate feature 34M/31164353. Golden Gate Claude (May 23, 2024): "online for a 24-hour period as a research demo".
20. **Amazon and Google investments.** Amazon up to $4bn on 25 Sep 2023 ($1.25bn plus $2.75bn), then a further $4bn in Nov 2024. Google $500M plus $1.5B (Reuters).

### Still UNVERIFIED (do not use as quotes)
- Sam Altman's 5 Dec 2022 "1 million users" tweet wording.
- Ilya Sutskever's 20 Nov 2023 apology wording.
- LeCun "less intelligent than a cat" quotes.
- Whether the AI Act's 2024 phase-in dates were later amended (lead only).
