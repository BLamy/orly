# Brief — Durable Objects, Unbound

## The request (verbatim)

> Can you launch a Claude code in my orly repo and do a film on the history explaining durable objects, celld and the cloudflare acquisition and wha they are doing now with making it more open. https://github.com/cloudflare/workerd/commit/aa494794c44a900592c8281b191302d3b0a6e2a5

> Make sure you dive deep into the grantees around what makes this possible. Things like s3 repaxd in place and all the things that make it possible I want to dive really deep into things like wal and how s3 is all you need and it provides everything required for the distributed db.

> Don’t use Astra ever use 6.1 sol also never use fable use opus 5.5

## Production parameters

| Parameter | Value |
|---|---|
| Form | A genuine Orly film: continuous cinematic Canvas2D silhouette documentary; format-3 manifest with kind film; VHS shelf entry and ?film=durable-objects-unbound player; rendered movie |
| Runtime | Target 24 minutes, approximately 3000 spoken words with space for teaching demonstrations and music; 20–28 minutes acceptable |
| Audience | A curious programmer who wants the real distributed-systems guarantees, with enough mechanical depth for an experienced engineer |
| Look | Orly's silhouette / paper-cut theatre, motivated light, three or more depth planes, recurring physical teaching machines, respectful historical silhouettes if people appear |
| Must cover | Durable Objects in 2020; open-source workerd in 2022; SQLite in 2024; celld; Deno team joining Cloudflare and the announced commitments; experimental open self-hosted clustering and its dated limits |
| Deep dives | Why strong object-store reads and conditional updates can provide the authority primitive normally obtained from a separate coordination service; lease assumptions and fencing; SQLite WAL commit capture; proof-before-response; snapshot/replay and missing-data limits; celld follower fsync and predecessor-session sealing |
| Narration | ElevenLabs, a distinct measured mid-life documentary narrator archetype; no imitation of a real person; speech-first locked edit with real character/word alignment |
| Music | Original sparse Strudel score composed for the locked film clock, mixed beneath the voice |
| Models | Claude Opus 5.5 through latest Claude Code at high effort for every film story, code, music and review role. GPT-6.1 Sol may coordinate. No Astra, Fable or provider fallback |
| As of | 2026-10-31 |
| Deliverable | Film pipeline production, verified in the film player and uploaded as a preview on the existing PR |

## Editorial guardrails

- Ground all claims in primary sources and pinned source snapshots. Reuse the existing verified research, but write a film treatment and screenplay from it.
- Initial workerd snapshot aa494794c44a900592c8281b191302d3b0a6e2a5 is experimental and lacks alarms; later inspected ad78a8fe76b32dd4f19c58d81b2e03e10a996bba includes alarm tests. Celld snapshot 8702f6d186c77698dbfb30cf29e3b1922a88f008 is v0.6.3. Keep implementations distinct.
- Treat the Cloudflare transition according to the public announcements. Do not invent purchase terms or an acquisition price. Describe roadmap statements as announced intentions.
- A bucket supplies primitives and retained bytes, not application execution or free coordination. API compatibility alone does not establish fresh reads or correct conditional writes. One-key serialization is not arbitrary multi-object SQL atomicity.
- A timeout does not prove a machine died. A claimed epoch is not necessarily an opened epoch. Missing complete retained-tail proof can block recovery; one bad follower alone is not a universal blocking rule.
- Label example room names, messages, hosts, sequences and timelines as illustrative. Do not invent benchmarks or claim upstream suites were executed.
- Follow .claude/commands/new-film.md and .claude/skills/film-shot/SKILL.md. The preceding book is reference research only; it is not an acceptable film output.
