# Brief — replay-qa-promo (marketing film for Replay QA)

## The request (verbatim)

> /Users/blamy/Downloads/MYvTymwMvcRUjizt.mp4 can you look at this video and then create a marketing video similar to it for https://qa.replay.io/ please use browser use to get rrweb recordings of our app. Then cleanup the rrweb recordings so that they are more useable as marking material. Then include them inside of our overall marketing video. I want to demo bugs which are only possible with our time travel debugging such as performance related things. And also have a moment where where we show two agents working one is the developer and the other is a critic and the developer keeps passing the replay recording to the critic who then says if it's good or bad. This shoudl be kind of a subtle thing because we should mostly focus on replay qa as a fully managed e2e testing platform that can run on a schedule run against staging run against PRs ect.

> do this using our new film pipeline

> So i want music composed with strudle and everything like our films.

Answers (2026-10-14): footage = whatever is in the user's Replay QA account (pick the strongest; create or change nothing); length ≈ 90 s; capture with Playwright (signed-in persistent profile), not the Chrome extension.

## Production parameters (normalized)

| parameter | value |
|---|---|
| form | **promo** (product marketing film), not a documentary: see `look.md` |
| target length | about 90 seconds (hard ceiling 100 s) |
| look | the reference promo (`reference/`): soft gradient hazes (peach → violet → coral), bracketed kinetic type (`{ in one place }`, `{ introducing }`), one typed prompt blown up full-frame with a caret, a step list that resolves ("Building Image → Processing / Generating / Assemble"), a collage of results with kinetic words woven through, a tagline end card over a warm gradient. Product UI appears as **cleaned rrweb recordings of qa.replay.io**, framed as floating screens (CSS 3-D perspective), with a drawn cursor and zoom-ins on the moment that matters |
| footage | rrweb recordings of qa.replay.io (signed in, the user's own projects) made with `tools/promo/rr-capture.mjs` and cleaned with `tools/promo/rr-clean.mjs` (redaction, dead-time compression, smoothed cursor, hidden chrome, local assets, named moments) |
| message (primary) | Replay QA is a **fully managed end-to-end testing platform**: point it at your app; it explores, builds journeys, runs them on a schedule, against staging, and on every pull request; every run is a recording; every bug comes with root-cause analysis |
| message (the hook) | some bugs only exist **in time**: performance and timing bugs (a poll that fires every 800 ms, a sync loop that re-fetches 258 times, a 67 ms React commit that drops frames) are invisible in a screenshot or a log line and obvious in a recording you can rewind |
| message (subtle) | a developer agent and a critic agent: the developer keeps handing the critic a Replay recording; the critic answers "not yet" or "good"; about 6-8 s, in a corner of the frame or as one quiet beat, never the headline |
| narration | one warm, confident, mid-life narrator (not elderly; a voice no other orly film uses), short lines, product-promo cadence; never an imitation of a real person |
| music | Strudel, composed to the locked clock like the films: modern, bright, rhythmic (soft four-on-the-floor or broken-beat electronica with warm pads), cuts and type hits land on downbeats; no chimes for machines |
| models | Claude Opus 5.5 (`claude-opus-5-5`), high effort, for all code and story |
| as-of date | 2026-10-14 |

## Editorial guardrails

- **Real product, real data.** Every on-screen number, bug title and capability comes from the captured recordings, the account's API data (`capture/api/`), docs.replay.io (`research/sources/`) or the replay-qa book; nothing invented. Paraphrased bug titles must keep their numbers exact.
- **No secrets on screen.** Recordings are redacted before they enter the film (login variables, tokens, API keys, emails other than the account owner's display name). Raw captures never leave `capture/raw/` (gitignored).
- Never render the publisher name "O'Reilly"; the shelf label stays the parody "O'RLY?".
- Brand: the product is "Replay QA" (by Replay, replay.io). Do not imitate other companies' brands.

## Director's notes (2026-10-14, from the requester — final; reviewers must not reverse them)
- Nested product screenshots must show exactly the intended region. The schedule-take shots (ch04-s01, ch04-s02) were
  off and are now ALL DRAWN (sets/abstract.ts), no rrweb. Keep the other shots' footage as is (the requester likes them).
- ch01-s03 '{ introducing }': type, braces and dots ONLY. No product stills/stamps/screenshots inside or around the word.
- The developer ↔ critic agent beat is NOT its own shot (ch05-s05 was cut). It lives small and quiet at the BOTTOM of
  ch06-s01 while the narrator talks about other things ('Every run, a recording… rerun to confirm').
- ch02-s02: the floating browser's URL bar reads 'qa.replay.io'.
