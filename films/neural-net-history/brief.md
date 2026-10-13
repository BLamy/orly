# Brief — neural-net-history (pilot film)

## The request (verbatim)

> I want you to build an educational cartoon that is artistic, visually stunning, creative, and educational at the same time. Watching this video should feel like something new. A new way to learn. Memorable. Exceptional.
>
> I want to learn the history of Neural Nets - as it was studied, and by whom. The debates. Classical ML. Cold Winter, ChatGPT, Anthropic and the AI race with china. Take us through the history of AI and educate us on the current understanding at that time, what people believed, who dissented, how long people thought that way? Cover about the experiments. Cover alexnet and transformers in depth.
>
> I want you to generate the music please use browser use and https://strudel.cc/ to compose music. Look at the orly repo and use eleven labs to create a and use a slow distinguished Godfrey Hinton like voice. Work in a loop until you have achieved excellence. You may call as many subagents as needed; however, only use opus 5.5 on high reasoning when writing any code, or writing any of the story, nothing else should be used for those but opus 5.5.
>
> Take your time, you have as many tokens as you need. i want this to spark curiosity in all who watch.

## Production parameters (normalized)

| parameter | value |
|---|---|
| form | long-form educational animated film, rendered in JavaScript (deterministic SVG/Canvas timelines) |
| target length | 30–35 minutes (reference production runs 35:37) |
| look | silhouette / paper-cut theatre: black cut-out figures and architecture, backlit dusky gradients, haze, candle glow, multiplane depth (reference frame: `.orly-work/reference/silhouette-reference.png`, gitignored) |
| must cover | how neural nets were studied and by whom; the debates; classical ML; the AI winters; ChatGPT; Anthropic; the US–China AI race; for each era: the understanding of the time, what people believed, who dissented, and how long the belief held; the key experiments |
| deep dives | AlexNet (in depth) and transformers (in depth) — real mechanics, not hand-waving |
| narration | ElevenLabs. A distinguished, measured British narrator **archetype**, mid-life (forties or fifties), **not** an old-man voice (user direction, 2026-10-05: the first film's voice was "sooo old"); soft-spoken, unhurried, warm, wry. Must be a **different voice** from every other film (not perceptron-short's). Do **not** clone or imitate any real person's voice (Geoffrey Hinton appears as a character in this film; the narrator must not sound like, or claim to be, him). |
| music | composed as Strudel code, auditioned on https://strudel.cc via browser automation, captured losslessly |
| models | Claude Opus 5.5 (`claude-opus-5-5`) at high effort writes all code and all story. Nothing else writes code or story. |
| quality bar | work in a loop until excellent; it must spark curiosity in everyone who watches |
| as-of date | 2026-10-05 (the "current understanding" ends here) |

## Editorial guardrails

- Every factual claim, date, number, and quotation must trace to the verified research bible (`research/`). Quotes are verbatim from reliable sources or they are not used.
- Real people are depicted respectfully as silhouettes; never put invented words in a real person's mouth.
- Geopolitics (the US–China race) is presented factually and even-handedly: export controls, compute, talent, open-weight models, safety debates. No caricature of any nation or people.
- Anthropic is covered with the same factual standard as every other lab: no promotion.
